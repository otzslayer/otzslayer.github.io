---
created: 2023-10-15
title: 추론 시스템 생성 - 웹 싱글 패턴
layout: post
tags: [inference-system, mlops]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

## 유스케이스

웹 싱글 패턴은 한 대의 웹 API 서비스에 머신러닝 추론 모델을 포함하는 패턴입니다. 즉 API에 데이터와 함께 요청을 보내면 추론 결과를 얻을 수 있는 단순한 구조를 지향합니다. 따라서 **가장 간단한 구성을 통해 추론 모듈을 신속하게 배포해 모델의 성능을 검증하고 싶은 경우**에 자주 사용합니다.

## 아키텍처

![](https://i.imgur.com/tOaTRNo.png){: w="600"}

웹 싱글 패턴의 아키텍처는 한 대의 서버에서 필요한 최소한의 기능만을 개발하고 외부 인터페이스도 대부분의 시스템에서 사용이 가능한 웹 프레임워크(Flask, FastAPI 등)를 사용하는 것이 좋습니다. 기본적으로 웹 싱글 패턴은 위 그림처럼 웹 애플리케이션 서버에 모델을 포함시키는 패턴입니다. 동일 서버에 REST 인터페이스와 전처리, 학습이 끝난 모델을 설치하여 간단한 추론 모듈을 구현합니다. ML의 추론은 대부분 **Stateless**이기 때문에 DB나 스토리지 등의 데이터를 영속적으로 보존하는 퍼시스턴트(Persistent) 계층 없이 웹 서버 한 대로 구성이 가능합니다.

> **Stateless**  
> 세션이 종료될 때까지 클라이언트의 세션 정보를 저장하고 있는 Stateful과 다르게 **클라이언트의 요청에 따른 응답만 처리하는 네트워크 프로토콜**을 의미합니다. Stateless한 경우 서버에서 단순한 응답만 처리하기 때문에 추후 확장에 용이하다는 특징이 있습니다.
{:.prompt-info}

만약 가용성을 위해서 여러 대의 웹 서버로 운용하는 경우엔 로드 밸런서를 도입해 부하를 분산시키기도 합니다.

## 구현

구현은 scikit-learn 을 이용한 SVM 모델과 FastAPI, ONNX Runtime을 활용합니다. 우선 추론 모듈의 엔트리포인트(Entrypoint)가 되는 `src/app/app.py`는 다음과 같습니다.

```python
# src/app/app.py

import os
from logging import getLogger

from fastapi import FastAPI
from src.app.routers import routers
from src.configurations import APIConfigurations

logger = getLogger(__name__)

app = FastAPI(
    title=APIConfigurations.title,
    description=APIConfigurations.description,
    version=APIConfigurations.version,
)

app.include_router(routers.router, prefix="", tags=[""])
```

위 코드가 실행하는 API는 다음과 같습니다.

```python
# src/app/routers/routers.py


@router.get("/predict/test/label")
def predict_test_label() -> Dict[str, str]:
    job_id = str(uuid.uuid4())
    prediction = classifier.predict_label(data=Data().data)
    logger.info(f"test {job_id}: {prediction}")
    return {"prediction": prediction}


@router.post("/predict")
def predict(data: Data) -> Dict[str, List[float]]:
    job_id = str(uuid.uuid4())
    prediction = classifier.predict(data.data)
    prediction_list = list(prediction)
    logger.info(f"{job_id}: {prediction_list}")
    return {"prediction": prediction_list}


@router.post("/predict/label")
def predict_label(data: Data) -> Dict[str, str]:
    job_id = str(uuid.uuid4())
    prediction = classifier.predict_label(data.data)
    logger.info(f"test {job_id}: {prediction}")
    return {"prediction": prediction}
```

위 코드에는 `/predict/test` 가 있는데 이에 대한 GET 요청을 통해 추론 모듈 내에 넣어둔 샘플 데이터로 추론하고 그 결과를 응답 받습니다. 이 엔드포인트는 배포 전후의 통합 테스트 등에서 사용하는 상황에서 사용됩니다. 실제로는 `/predict`나 `/predict/label`에 POST 요청을 통해 추론 결과를 얻게 됩니다. 그리고 `/predict*` 엔드포인트는 로그에서 각 요청을 유일하게 특정하기 위해서 각 요청마다 ID를 부여합니다. 

추가로 다음과 같은 엔드포인트도 준비합니다.

- `/health` : 헬스체크용 엔드포인트
- `/metadata` : 추론 모듈 입출력 정보를 제공하는 엔드포인트
- `/label` : 추론 라벨의 목록을 출력하는 엔드포인트

모델 코드에서는 환경 변수로 지정한 모델 파일 경로를 통해 모델을 불러옵니다. 그리고 `Classifier` 클래스에서 추론을 실시합니다. 마지막으로 ONNX Runtime을 통해 `predict` 함수로 각 라벨의 확률값을 예측하고 `predict_label` 함수로 가장 확률이 높은 라벨을 출력합니다.

```python
# src/ml/prediction.py

import json
from logging import getLogger
from typing import Dict, List, Sequence

import numpy as np
import onnxruntime as rt
from pydantic import BaseModel
from src.configurations import ModelConfigurations

logger = getLogger(__name__)


class Data(BaseModel):
    data: List[List[float]] = [[5.1, 3.5, 1.4, 0.2]]


class Classifier(object):
    def __init__(
        self,
        model_filepath: str,
        label_filepath: str,
    ):
        self.model_filepath: str = model_filepath
        self.label_filepath: str = label_filepath
        self.classifier = None
        self.label: Dict[str, str] = {}
        self.input_name: str = ""
        self.output_name: str = ""

        self.load_model()
        self.load_label()

    def load_model(self):
        logger.info(f"load model in {self.model_filepath}")
        self.classifier = rt.InferenceSession(self.model_filepath)
        self.input_name = self.classifier.get_inputs()[0].name
        self.output_name = self.classifier.get_outputs()[0].name
        logger.info(f"initialized model")

    def load_label(self):
        logger.info(f"load label in {self.label_filepath}")
        with open(self.label_filepath, "r") as f:
            self.label = json.load(f)
        logger.info(f"label: {self.label}")

    def predict(self, data: List[List[int]]) -> np.ndarray:
        np_data = np.array(data).astype(np.float32)
        prediction = self.classifier.run(None, {self.input_name: np_data})
        output = np.array(list(prediction[1][0].values()))
        logger.info(f"predict proba {output}")
        return output

    def predict_label(self, data: List[List[int]]) -> str:
        prediction = self.predict(data=data)
        argmax = int(np.argmax(np.array(prediction)))
        return self.label[str(argmax)]


classifier = Classifier(
    model_filepath=ModelConfigurations().model_filepath,
    label_filepath=ModelConfigurations().label_filepath,
)
```

추론 모듈 서버는 Gunicorn을 통해 실행합니다. FastAPI 이므로 Uvicorn을 사용할 수도 있는데 WSGI와 ASGI가 가진 장점을 모두 얻기 위해 Gunicorn에서 Uvicorn을 호출해 유연한 서버 운용을 가능하게 합니다.

> **WSGI (Web Server Gateway Interface)**  
> 웹 서버와 웹 애플리케이션의 인터페이스를 위한 파이썬 프레임워크
> 
> **ASGI (Asynchronous Server Gateway Interface)**  
> 비동기 가능 파이썬 웹 서버, 프레임워크 및 애플리케이션 간의 표준 인터페이스를 제공하는 프레임워크
{:.prompt-info}

```bash
#!/bin/bash

set -eu

HOST=${HOST:-"0.0.0.0"}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-4}
UVICORN_WORKER=${UVICORN_WORKER:-"uvicorn.workers.UvicornWorker"}
LOGLEVEL=${LOGLEVEL:-"debug"}
LOGCONFIG=${LOGCONFIG:-"./src/utils/logging.conf"}
BACKLOG=${BACKLOG:-2048}
LIMIT_MAX_REQUESTS=${LIMIT_MAX_REQUESTS:-65536}
MAX_REQUESTS_JITTER=${MAX_REQUESTS_JITTER:-2048}
GRACEFUL_TIMEOUT=${GRACEFUL_TIMEOUT:-10}
APP_NAME=${APP_NAME:-"src.app.app:app"}

gunicorn ${APP_NAME} \
    -b ${HOST}:${PORT} \
    -w ${WORKERS} \
    -k ${UVICORN_WORKER} \
    --log-level ${LOGLEVEL} \
    --log-config ${LOGCONFIG} \
    --backlog ${BACKLOG} \
    --max-requests ${LIMIT_MAX_REQUESTS} \
    --max-requests-jitter ${MAX_REQUESTS_JITTER} \
    --graceful-timeout ${GRACEFUL_TIMEOUT} \
    --reload
```

## 특징

웹 싱글 패턴은 다음의 이점이 있습니다.

- 추론기를 가볍고 신속하게 가동시킬 수 있음
	- API와 추론 모듈로만 구성되어 있기 때문에 범용적이면서 단순한 구조를 가짐
	- 특수한 설정이나 설계가 필요하지 않음
- 구성이 간단하기 때문에 장애 대응이나 복구도 간단함
	- 애초에 장애가 발생할 수 있는 포인트가 많지 않음

하지만 웹 싱글 패턴은 애초에 복잡한 처리를 고려하지 않았기 때문에 여러 개의 모델과 복잡한 워크플로우를 통해 추론을 수행하는 경우엔 웹 싱글 패턴으로는 해결이 어렵습니다.