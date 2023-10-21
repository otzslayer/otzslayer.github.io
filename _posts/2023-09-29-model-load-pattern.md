---
title: 모델 배포 - 모델 로드 패턴
layout: post
tags: [inference, model-deployment, mlops]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

![](https://i.imgur.com/9A8C3Iu.png){: w="600"}

## 유스케이스

**모델 로드 패턴은 모델을 서버 이미지에 빌트인하지 않고 추론 모듈을 기동할 때 다운로드 받는 방식**입니다. 서버 이미지 버전보다 추론 모델의 버전을 더 빈번하게 갱신하는 경우나 동일한 서버 이미지로 여러 종류의 추론 모델 가동이 가능한 경우에 사용합니다.

추론 모델을 자주 빌드하게 된다면 앞선 포스트에서 다룬 모델-인-이미지 패턴을 사용했을 때 서버 이미지를 자주 빌드하게 되므로 운영적인 측면에서 효율적이라고 할 수 없습니다. 적당한 하이퍼파라미터를 선정하였고 새로운 데이터만 바꿔넣는 형태라면 모델 로드 패턴이 최적의 솔루션이 될 수 있습니다.

## 아키텍처

![](https://i.imgur.com/CxrZKrT.png){: w="600"}

이 패턴에서는 서버 이미지와 모델을 별도로 관리함에 따라 서버 이미지의 빌드와 모델의 학습이 분리됩니다. 따라서 **서버 이미지를 경량화할 수 있습니다.** 또한 서버 이미지를 범용적으로 사용할 수 있으므로 동일한 이미지를 여러 개의 추론 모델에 응용할 수 있습니다.

모델 로드 패턴에서는 추론 모듈을 배치할 때 서버 이미지를 Pull하고 난 다음 추론 모듈을 기동합니다. 그리고나서 모델 파일을 불러와 추론 모듈을 본격적으로 가동합니다. 이때 환경변수 등을 사용하여 추론 서버에서 가동하는 모델을 유연하게 변경할 수 있습니다.

모델 로드 패턴의 단점이라고 하면 **모델이 라이브러리의 버전에 의존적일 때 서버 이미지의 버전 관리와 모델 파일의 버전 관리를 별도로 수행해야 한다는 점**입니다. 따라서 모델이 많아질 수록 복잡해지고 운용 부하가 커질 위험이 있습니다.

## 구현

구현할 때 가장 중요한 점은 모델 파일을 도커 이미지에 포함시키지 않는 것입니다. 여기에서는 쿠버네티스 클러스터를 Google Kubernetes Engine에 구축하고, 모델 파일은 GCP Storage에 보존하여 컨테이너 기동 시마다 불러오도록 합니다. 이하의 코드는 모두 출판사에서 공식적으로 제 공하는 [소스코드 저장소](https://github.com/wikibook/mlsdp/tree/main/chapter3_release_patterns/model_load_pattern)에서 발췌하였습니다.

우선 아래 메인 스크립트는 파일의 다운로드를 실행하는 내용을 담고 있습니다.

```python
# model_loader/main.py

import os
from logging import DEBUG, Formatter, StreamHandler, getLogger

import click
from google.cloud import storage

logger = getLogger(__name__)
logger.setLevel(DEBUG)
strhd = StreamHandler()
strhd.setFormatter(Formatter("%(asctime)s %(levelname)8s %(message)s"))
logger.addHandler(strhd)


@click.command(name="model loader")
@click.option("--gcs_bucket", type=str, required=True, help="GCS bucket name")
@click.option("--gcs_model_blob", type=str, required=True, help="GCS model blob path")
@click.option("--model_filepath", type=str, required=True, help="Local model file path")
def main(gcs_bucket: str, gcs_model_blob: str, model_filepath: str):
    logger.info(f"download from gs://{gcs_bucket}/{gcs_model_blob}")
    dirname = os.path.dirname(model_filepath)
    os.makedirs(dirname, exist_ok=True)

    client = storage.Client.create_anonymous_client()
    bucket = client.bucket(gcs_bucket)
    blob = bucket.blob(gcs_model_blob)
    blob.download_to_filename(model_filepath)
    logger.info(f"download from gs://{gcs_bucket}/{gcs_model_blob} to {model_filepath}")


if __name__ == "__main__":
    main()
```

그리고 Dockerfile에는 모델 파일을 포함시키지 않은 채 모델을 실행하기 위한 코드를 빌드합니다.

```Dockerfile
# Dockerfile

FROM python:3.8-slim

ENV PROJECT_DIR model_load_pattern
WORKDIR /${PROJECT_DIR}
ADD ./requirements.txt /${PROJECT_DIR}/
RUN apt-get -y update && \
    apt-get -y install apt-utils gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir -r requirements.txt

COPY ./src/ /${PROJECT_DIR}/src/
COPY ./models/label.json /${PROJECT_DIR}/models/label.json

ENV LABEL_FILEPATH /${PROJECT_DIR}/models/label.json
ENV LOG_LEVEL DEBUG
ENV LOG_FORMAT TEXT

COPY ./run.sh /${PROJECT_DIR}/run.sh
RUN chmod +x /${PROJECT_DIR}/run.sh
CMD [ "./run.sh" ]
```

이제 다운로드용 도커 이미지와 추론 API의 도커 이미지를 이용해 쿠버네티스 클러스터에 웹 API를 배포합니다. 이때 쿠버네티스에는 `initContainers`를 지정해 초기화용 컨테이너를 기동합니다. 이를 위한 매니페스트는 다음과 같습니다.

```yaml
# manifests/deployment.yml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-load
  namespace: model-load
  labels:
    app: model-load
spec:
  replicas: 4
  selector:
    matchLabels:
      app: model-load
  template:
    metadata:
      labels:
        app: model-load
    spec:
      containers:
        - name: model-load
          image: shibui/ml-system-in-actions:model_load_pattern_api_0.0.1
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: 500m
              memory: "300Mi"
            requests:
              cpu: 500m
              memory: "300Mi"
          volumeMounts:
            - name: workdir
              mountPath: /workdir
          env:
            - name: MODEL_FILEPATH
              value: "/workdir/iris_svc.onnx"
      initContainers:
        - name: model-loader
          image: shibui/ml-system-in-actions:model_load_pattern_loader_0.0.1
          imagePullPolicy: Always
          command:
            - python
            - "-m"
            - "src.main"
            - "--gcs_bucket"
            - "ml_system_model_repository"
            - "--gcs_model_blob"
            - "iris_svc.onnx"
            - "--model_filepath"
            - "/workdir/iris_svc.onnx"
          volumeMounts:
            - name: workdir
              mountPath: /workdir
      volumes:
        - name: workdir
          emptyDir: {}

---
apiVersion: v1
kind: Service
metadata:
  name: model-load
  namespace: model-load
  labels:
    app: model-load
spec:
  ports:
    - name: rest
      port: 8000
      protocol: TCP
  selector:
    app: model-load

---
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: model-load
  namespace: model-load
  labels:
    app: model-load
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-load
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

코드 스니펫 중간을 보면 `initContainers`로 모델 파일을 다운로드하고, `iris_svc.onnx`를 추론 모듈 컨테이너에서 불러오는 구조입니다. 모델-인-이미지 패턴과 다른 점은 `imagePullPolicy: Always` 설정을 하지 않는다는 것입니다. 모델의 업데이트는 반드시 `initContainers`를 통해서 이루어집니다.

이제 `kubectl` 명령어를 통해 추론 요청을 시도합니다.

```bash
kubectl apply -f manifests/namespace.yml
```

그리고 모델이 올바르게 다운로드 되었는지 로그를 통해 확인할 수 있습니다.

```bash
kubectl -n model-load logs deployment.apps/model-load
```

이제 클러스터 내부 엔드포인트에 포트를 포워딩하고 테스트 데이터를 POST 요청합니다.

```bash
kubectl \
  -n model-load \
  port-forward deployment.apps/model-load \
  8000:8000 &

curl \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}' \
  localhost:8000/predict
```

## 장점

장점을 요약하자면 다음과 같습니다.

- 서버 이미지 버전과 모델 파일의 버전 분리가 가능함
- 서버 이미지의 응용성이 향상되며 서버 이미지가 가벼워짐
