---
title: 추론 시스템 생성 - 비동기 추론 패턴
layout: post
tags: [inference-system, mlops, asynchronous]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

## 유스케이스

 **클라이언트 애플리케이션에서 추론 요청 직후의 처리가 추론 결과에 의존하지 않는 워크플로우**인 경우에 비동기 추론 패턴를 사용합니다. 또한 클라이언트와 추론 결과의 출력 위치를 분리하고 싶은 경우나 추론에 시간이 오래 걸려 클라이언트를 오래 기다리게 하고 싶지 않은 경우에 사용합니다.

이전 포스트에서 다루었던 동기 추론 패턴에서는 추론 결과를 기다리는 동안 모든 프로세스를 멈춘 채 결과를 기다려야 합니다. 추론 속도가 빠르다면 문제가 없지만 모델의 연산량이 많은 경우엔 문제가 될 수 있습니다.

![](https://i.imgur.com/nPwLaM4.png){: w="600"}

그 외에도 동기적으로 처리할 필요가 없는 워크플로우도 있습니다. 위 그림과 같은 스마트폰 앱을 떠올려 보겠습니다. 어떤 사진을 업로드하여 사진의 해상도를 개선해 사용자에게 제공하는 앱이 있을 때 동기 처리를 한다면 사진 하나의 처리가 끝날 때까지 다음 사진을 처리할 수 없습니다. 하지만 이런 앱에서는 사진을 업로드하고 난 다음의 처리를 비동기적으로 실시합니다. 사진의 화질을 개선하는 동아나 특정 푸시 메시지를 송신해 클라이언트의 조작을 멈추지 않고 화질을 개선하는 시간을 확보할 수 있습니다.

추론에 많은 시간이 소요되는 무거운 ML 모델이라면 이러한 비동기적인 워크플로우를 활용해 시스템의 전체 성능을 유지하거나 사용자 경험을 높이는 것이 권장됩니다.


## 아키텍처

비동기 추론 패턴에서는 요청과 추론 모듈 사이에 큐(Apache Kafka)나 캐시(Rabbit MQ 또는 Redis Cache)를 배치해 추론 요청과 추론 결과의 취득을 비동기화합니다. 추론 결과를 얻기 위해서는 클라이언트에서 직접 추론 결과가 출력되는 곳으로 정기적으로 접속해 결과를 얻어내야 합니다.

![](https://i.imgur.com/hyDvp3A.png){: w="600"}

![](https://i.imgur.com/kAR7Rwj.png){: w="600"}

비동기 추론 패턴은 추론 결과가 출력되는 곳에 따라 여러 아키텍처로 구현할 수 있습니다. 추론 결과를 첫 번째 그림처럼 큐나 캐시에 저장할 수도 있고 두 번째 그림처럼 데이터베이스 등의 다른 시스템에 출력할 수도 있습니다. 출력 위치는 시스템의 워크플로우에 따라 구성합니다. 추론 결과를 클라이언트에 직접 전달할 수도 있지만, 추론 모듈 측이 클라이언트에 추론을 반환하기 위한 커넥션이 필요하게 되고 시스템이 복잡해지기 때문에 권장하지 않습니다.

## 구현

구현 내용은 동기 추론 패턴과 유사하게 InceptionV3 모델을 TensorFlow Serving으로 기동하는 것으로 합니다. 클라이언트로부터의 추론 요청 엔드포인트에는 FastAPI로 프록시를 중개합니다. 프록시는 추론 요청에 대해 작업 ID를 응답하고, 백그라운드에서 Redis에 요청 데이터를 등록합니다. Redis에 등록된 요청 데이터는 배치로 TensorFlow Serving이 추론하고, 추론 결과는 다시 Redis로 등록됩니다. 클라이언트가 작업 ID를 프록시에 요청하면 추론이 완료되었을 때 그 결과를 얻게 되는 구성입니다.

![](https://i.imgur.com/hnsvF3u.png){: w="600"}

클라이언트와 추론 모듈 본체(TensorFlow Serving) 사이에 FastAPI와 Redis, 배치 서버가 있는 아키텍처입니다. 클라이언트는 비동기화로 인해 추론이 완료될 때까지 작업을 중지할 필요가 없습니다. 다만 클라이언트에서 추론 결과를 얻기 위해서는 프록시를 폴링해야 합니다.

프록시는 위에서 언급한 것처럼 FastAPI와 Gunicorn으로 구성합니다. 그리고 `/predict`, `/predict/test` 외에 `/job/{job_id}` 라는 엔드포인트를 만듭니다. 내부데이터에 의한 테스트는 `/predict/test`, 클라이언트로부터의 요청은 `/predict`, 추론 결과 요청은 `/job/{job_id}`를 사용합니다.

```python
# src/app/routers/routers.py

import base64
import io
import uuid
from logging import getLogger
from typing import Any, Dict

import requests
from fastapi import APIRouter, BackgroundTasks
from PIL import Image
from src.app.backend import background_job, store_data_job
from src.app.backend.data import Data
from src.configurations import ModelConfigurations

logger = getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health() -> Dict[str, str]:
    return {"health": "ok"}


@router.get("/metadata")
def metadata() -> Dict[str, Any]:
    model_spec_name = ModelConfigurations.model_spec_name
    address = ModelConfigurations.address
    port = ModelConfigurations.rest_port
    serving_address = f"http://{address}:{port}/v1/models/{model_spec_name}/versions/0/metadata"
    response = requests.get(serving_address)
    return response.json()


@router.get("/label")
def label() -> Dict[int, str]:
    return ModelConfigurations.labels


@router.get("/predict/test")
def predict_test(background_tasks: BackgroundTasks) -> Dict[str, str]:
    job_id = str(uuid.uuid4())[:6]
    data = Data()
    data.image_data = ModelConfigurations.sample_image
    background_job.save_data_job(data.image_data, job_id, background_tasks, True)
    return {"job_id": job_id}


@router.post("/predict")
def predict(data: Data, background_tasks: BackgroundTasks) -> Dict[str, str]:
    image = base64.b64decode(str(data.image_data))
    io_bytes = io.BytesIO(image)
    data.image_data = Image.open(io_bytes)
    job_id = str(uuid.uuid4())[:6]
    background_job.save_data_job(
        data=data.image_data,
        job_id=job_id,
        background_tasks=background_tasks,
        enqueue=True,
    )
    return {"job_id": job_id}


@router.get("/job/{job_id}")
def prediction_result(job_id: str) -> Dict[str, Dict[str, str]]:
    result = {job_id: {"prediction": ""}}
    data = store_data_job.get_data_redis(job_id)
    result[job_id]["prediction"] = data
    return result
```

`/predict` 요청 백그라운드에서는 Redis에 큐를 등록합니다. 큐에는 작업 ID를 키로 갖는 요청 이미지를 등록합니다. 백그라운드 처리에는 FastAPI의 BackgroundTasks를 사용하여 요청에 응답 후 실행하게 예약할 수 있습니다. 다음은 Redis로의 등록을 BackgroundTasks로 실행하는 코드입니다.

```python
# src/app/backend/store_data_job.py

import base64
import io
import json
import logging
from typing import Any, Dict

import numpy as np
from PIL import Image
from src.app.backend.redis_client import redis_client

logger = logging.getLogger(__name__)


def make_image_key(key: str) -> str:
    return f"{key}_image"


def left_push_queue(queue_name: str, key: str) -> bool:
    try:
        redis_client.lpush(queue_name, key)
        return True
    except Exception:
        return False


def right_pop_queue(queue_name: str) -> Any:
    if redis_client.llen(queue_name) > 0:
        return redis_client.rpop(queue_name)
    else:
        return None


def set_data_redis(key: str, value: str) -> bool:
    redis_client.set(key, value)
    return True


def get_data_redis(key: str) -> Any:
    data = redis_client.get(key)
    return data


def set_image_redis(key: str, image: Image.Image) -> str:
    bytes_io = io.BytesIO()
    image.save(bytes_io, format=image.format)
    image_key = make_image_key(key)
    encoded = base64.b64encode(bytes_io.getvalue())
    redis_client.set(image_key, encoded)
    return image_key


def get_image_redis(key: str) -> Image.Image:
    redis_data = get_data_redis(key)
    decoded = base64.b64decode(redis_data)
    io_bytes = io.BytesIO(decoded)
    image = Image.open(io_bytes)
    return image


def save_image_redis_job(job_id: str, image: Image.Image) -> bool:
    set_image_redis(job_id, image)
    redis_client.set(job_id, "")
    return True
```

```python
# src/app/backend/background_job.py

import logging
from typing import Any, Dict

from fastapi import BackgroundTasks
from PIL import Image
from pydantic import BaseModel
from src.app.backend.store_data_job import left_push_queue, save_image_redis_job
from src.configurations import CacheConfigurations
from src.constants import CONSTANTS

logger = logging.getLogger(__name__)


class SaveDataJob(BaseModel):
    job_id: str
    data: Any
    queue_name: str = CONSTANTS.REDIS_QUEUE
    is_completed: bool = False

    def __call__(self):
        pass


class SaveDataRedisJob(SaveDataJob):
    enqueue: bool = False

    def __call__(self):
        save_data_jobs[self.job_id] = self
        logger.info(f"registered job: {self.job_id} in {self.__class__.__name__}")
        self.is_completed = save_image_redis_job(job_id=self.job_id, image=self.data)
        if self.enqueue:
            self.is_completed = left_push_queue(self.queue_name, self.job_id)
        logger.info(f"completed save data: {self.job_id}")


def save_data_job(
    data: Image.Image,
    job_id: str,
    background_tasks: BackgroundTasks,
    enqueue: bool = False,
) -> str:
    task = SaveDataRedisJob(
        job_id=job_id,
        data=data,
        queue_name=CacheConfigurations.queue_name,
        enqueue=enqueue,
    )
    background_tasks.add_task(task)
    return job_id


save_data_jobs: Dict[str, SaveDataJob] = {}
```

위 코드대로라면 Redis에는 `{job_id}_image`라고 하는 키로 바이너리 인코딩된 이미지 데이터가 등록됩니다. 등록된 데이터는 배치 서버에서 정기적으로 큐를 받아 추론합니다. 추론된 결과는 재체 Redis에 작업 ID를 키로 하여 등록됩니다. 배치 서버의 구현은 아래와 같습니다.

```python
# src/app/backend/prediction_batch.py

import asyncio
import base64
import io
import os
from concurrent.futures import ProcessPoolExecutor
from logging import DEBUG, Formatter, StreamHandler, getLogger
from time import sleep

import grpc
from src.app.backend import request_inception_v3, store_data_job
from src.configurations import CacheConfigurations, ModelConfigurations
from tensorflow_serving.apis import prediction_service_pb2_grpc

log_format = Formatter("%(asctime)s %(name)s [%(levelname)s] %(message)s")
logger = getLogger("prediction_batch")
stdout_handler = StreamHandler()
stdout_handler.setFormatter(log_format)
logger.addHandler(stdout_handler)
logger.setLevel(DEBUG)


def _trigger_prediction_if_queue(stub: prediction_service_pb2_grpc.PredictionServiceStub):
    job_id = store_data_job.right_pop_queue(CacheConfigurations.queue_name)
    logger.info(f"predict job_id: {job_id}")
    if job_id is not None:
        data = store_data_job.get_data_redis(job_id)
        if data != "":
            return True
        image_key = store_data_job.make_image_key(job_id)
        image_data = store_data_job.get_data_redis(image_key)
        decoded = base64.b64decode(image_data)
        io_bytes = io.BytesIO(decoded)
        prediction = request_inception_v3.request_grpc(
            stub=stub,
            image=io_bytes.read(),
            model_spec_name=ModelConfigurations.model_spec_name,
            signature_name=ModelConfigurations.signature_name,
            timeout_second=5,
        )
        if prediction is not None:
            logger.info(f"{job_id} {prediction}")
            store_data_job.set_data_redis(job_id, prediction)
        else:
            store_data_job.left_push_queue(CacheConfigurations.queue_name, job_id)


def _loop():
    serving_address = f"{ModelConfigurations.address}:{ModelConfigurations.grpc_port}"
    channel = grpc.insecure_channel(serving_address)
    stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)

    while True:
        sleep(1)
        _trigger_prediction_if_queue(stub=stub)


def prediction_loop(num_procs: int = 2):
    executor = ProcessPoolExecutor(num_procs)
    loop = asyncio.get_event_loop()

    for _ in range(num_procs):
        asyncio.ensure_future(loop.run_in_executor(executor, _loop))

    loop.run_forever()


def main():
    NUM_PROCS = int(os.getenv("NUM_PROCS", 2))
    prediction_loop(NUM_PROCS)


if __name__ == "__main__":
    logger.info("start backend")
    main()
```

`concurrent.futures.ProcessPoolExecutor`로 워커 프로세스를 기동하고, 1초에 한 번 Redis를 폴링해서 추론 대기 중인 작업이 있으면 큐에서 꺼내 TensorFlow Serving에 요청하는 구성으로 되어 있습니다.

이제 지금까지 구성된 내용을 Docker Compose로 기동하는데, 구성 정의 설정 파일은 다음과 같습니다.

```yaml
version: "3"

services:
  asynchronous_proxy:
    container_name: asynchronous_proxy
    image: shibui/ml-system-in-actions:asynchronous_pattern_asynchronous_proxy_0.0.1
    restart: always
    environment:
      - PLATFORM=docker_compose
      - QUEUE_NAME=tfs_queue
      - API_ADDRESS=imagenet_inception_v3
    ports:
      - "8000:8000"
    command: ./run.sh
    depends_on:
      - redis
      - imagenet_inception_v3
      - asynchronous_backend

  imagenet_inception_v3:
    container_name: imagenet_inception_v3
    image: shibui/ml-system-in-actions:asynchronous_pattern_imagenet_inception_v3_0.0.1
    restart: always
    environment:
      - PORT=8500
      - REST_API_PORT=8501
    ports:
      - "8500:8500"
      - "8501:8501"
    entrypoint: ["/usr/bin/tf_serving_entrypoint.sh"]

  asynchronous_backend:
    container_name: asynchronous_backend
    image: shibui/ml-system-in-actions:asynchronous_pattern_asynchronous_backend_0.0.1
    restart: always
    environment:
      - PLATFORM=docker_compose
      - QUEUE_NAME=tfs_queue
      - API_ADDRESS=imagenet_inception_v3
    entrypoint: ["python", "-m", "src.app.backend.prediction_batch"]
    depends_on:
      - redis

  redis:
    container_name: asynchronous_redis
    image: "redis:latest"
    ports:
      - "6379:6379"
```

다음의 명령어로 컨테이너를 기동합니다.

```bash
$ docker-compose \
    -f ./docker-compose.yml \
    up -d
```

이제 프록시에 이미지 파일을 POST 요청합니다. 이때 응답은 작업 ID입니다.

```bash
$ (echo \
    -n '{"image_data": "'; \
    base64 imagenet_inception_v3/data/cat.jpg; \
    echo '"}') | \
  curl \
    -X POST \
    -H "Content-Type: application/json" \
    -d @- \
    localhost:8000/predict

# 출력
{
  "job_id":"942c3b"
}
```

프록시에 작업 ID를 요청하면 다음과 같이 결과를 얻을 수 있습니다.

```bash
$ curl localhost:8000/job/942c3b

# 출력
{
  "942c3b": {
    "prediction": "Siamese cat"
  }
}
```

## 특징

비동기 추론 패턴을 사용하면 클라이언트의 워크플로우와 추론의 결합도를 낮출 수 있습니다. 또한 추론의 지연이 긴 경우에서 클라이언트에 대한 악영향을 피할 수 있습니다.

비동기 추론 패턴에서는 추론 실행 타이밍에 따라 아키텍처를 검토해야 합니다. 만약 요청을 FIFO로 추론하는 경우, 클라이언트와 추론 모듈의 중간에서 큐를 이용합니다. 클라이언트는 요청 데이터를 큐에 추가하고(enqueue), 추론 모듈은 큐에서 데이터를 꺼내는(dequeue) 방식입니다. 서버 장애 등으로 추론에 실패해 이를 재시도하기 위해서는 꺼낸 데이터를 큐로 되돌릴 필요가 있지만 되돌리지 못하는 상황도 발생합니다. 따라서 큐 방식으로 모든 데이터를 추론할 수 있다고는 할 수 없습니다.

위와 다르게 추론 순서에 구애받지 않는 경우엔 캐시를 이용할 수 있습니다. 클라이언트와 추론 모듈 중간에 캐시 서버를 준비하고 클라이언트로부터 요청 데이터를 캐시 서버에 등록합니다. 추론 모듈은 추론 이전의 캐시 데이터를 가져와 추론하고, 추론 결과를 캐시에 등록합니다. 그리고 추론 전 데이터를 추론이 끝난 상태로 변경하는 워크플로우를 탑니다. 이런 방식이라면 서버 장애로 인한 추론 실패에도 재시도가 가능합니다.


