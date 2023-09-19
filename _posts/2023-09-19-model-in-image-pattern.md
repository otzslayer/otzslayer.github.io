---
title: 모델-인-이미지 패턴
layout: post
tags: [inference, model-deployment, mlops]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

![](https://i.imgur.com/9A8C3Iu.png){: w="600"}

## 유스케이스

**모델-인-이미지(Model-in-image) 패턴은 추론 모듈의 이미지에 모델 파일을 포함해서 빌드하는 방식**입니다. 일반적으로 서버 이미지와 추론 모델의 버전을 일치시키고 싶을 때, 또는 추론 모델에 개별 서버 이미지를 준비하는 경우에 사용합니다.

추론 모듈을 실행하기 위해서는 서버로 모델을 불러와서 추론이 가능한 상태로 만들어야 합니다. 그런데 추론 모듈이 있는 환경과 모델 개발 환경은 서로 다르기 때문에 사용하는 라이브러리의 모델이 달라 문제가 발생할 수도 있습니다. 모델-인-이미지 패턴은 모델을 포함하여 서버를 빌드함으로써 해당 모델을 빌트인으로 실행하는 서버를 구축합니다. 따라서 **서버와 모델의 버전을 일치시킬 수 있다는 장점**이 있습니다.

## 아키텍처

클라우드 플랫폼이나 컨테이너를 이용한 서비스 운영은 이미 일반적인 방법이 되었습니다. 하지만 ML 모델을 서버 이미지로 관리하는 것과 버저닝은 중요한 고려사항이 됩니다. 모델-인-이미지 패턴에서는 서버나 컨테이너 이미지에 모델 파일을 포함시켜 모델 학습과 이미지 빌드를 하나의 워크플로우로 만들 수 있습니다. 이 경우 이미지의 버전과 모델 버전이 같아 별도의 버전 관리를 하지 않아도 된다는 장점이 있습니다.

![](https://i.imgur.com/MntTE0I.png){: w="600"}


이미지 빌드는 모델의 학습이 끝난 다음에 수행합니다. 운영 환경에서는 이 이미지를 Pull해서 실행한 다음 서비스를 배포할 수 있습니다.

다만 **이 패턴은 모델이 이미지에 포함되어 있기 때문에 추론용 서버 이미지를 빌드하는 시간이 길어지고 용량이 증가한다는 단점이 있습니다.** 따라서 서버 이미지의 용량 증가로 인해 이미지를 Pull하고 시스템을 가동하는 시간이 길어집니다. 또한 서버 이미지의 빌드가 모델의 학습이 완료된 이후에 이뤄지기 때문에 모든 과정을 아울러 빌드를 완료하는 파이프라인이 필요합니다. 그렇기 때문에 **원래의 모델 파일을 별도로 관리하는 것이 좋습니다.** 서버의 빌드에 실패했을 때 파이프라인의 처음부터 빌드하는 과정 전체를 다시 시작해야하기 때문입니다.

## 구현

추론 모듈의 인프라로는 쿠버네티스 클러스터를 사용합니다. 추론 모듈은 FastAPI 등으로 가동시켜 GET/POST 요청을 통해 접근하도록 합니다. 구현에는 다음 소프트웨어를 사용합니다.

> - Docker
> - Kubernetes
> - Python 3.8
> - Gunicorn + FastAPI
> - scikit-learn
> - ONNX Runtime
{:.prompt-info}

ML 모델은 scikit-learn에서 제공하는 SVM이며, 모델은 ONNX 형식으로 출력해 추론 모듈 내부에서는 ONNX Runtime으로 호출합니다. 이하의 코드는 모두 출판사에서 공식적으로 제공하는 [소스코드 저장소](https://github.com/wikibook/mlsdp/tree/main/chapter3_release_patterns/model_in_image_pattern)에서 발췌하였습니다.

우선 학습이 끝난 모델은 아래와 같이 Dockerfile을 통해 이미지에 포함시킵니다.

```Dockerfile
# Dockerfile

FROM python:3.8-slim

ENV PROJECT_DIR model_in_image_pattern  
WORKDIR /${PROJECT_DIR}  
ADD ./requirements.txt /${PROJECT_DIR}/  
RUN apt-get -y update && \  
    apt-get -y install apt-utils gcc curl && \  
    pip install --no-cache-dir -r requirements.txt  

COPY ./src/ /${PROJECT_DIR}/src/  
COPY ./models/ /${PROJECT_DIR}/models/

ENV MODEL_FILEPATH /${PROJECT_DIR}/models/iris_svc.onnx  
ENV LABEL_FILEPATH /${PROJECT_DIR}/models/label.json  
ENV LOG_LEVEL DEBUG  
ENV LOG_FORMAT TEXT

COPY ./run.sh /${PROJECT_DIR}/run.sh  
RUN chmod +x /${PROJECT_DIR}/run.sh  
CMD ["./run.sh"]
```

웹 API를 위한 앱, 라우터 코드는 저장소를 확인하시기 바랍니다.

그리고 쿠버네티스에서 웹 API를 가동하기 위한 매니페스트(manifest)를 다음과 같이 작성합니다.

```yaml
# manifests/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: model-in-image
  namespace: model-in-image
  labels:
    app: model-in-image
spec:
  replicas: 4
  selector:
    matchLabels:
      app: model-in-image
  template:
    metadata:
      labels:
        app: model-in-image
    spec:
      containers:
        - name: model-in-image
          image: shibui/ml-system-in-actions:model_in_image_pattern_0.0.1
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
          resources:
            limits:
              cpu: 500m
              memory: "300Mi"
            requests:
              cpu: 500m
              memory: "300Mi"

---
apiVersion: v1
kind: Service
metadata:
  name: model-in-image
  namespace: model-in-image
  labels:
    app: model-in-image
spec:
  ports:
    - name: rest
      port: 8000
      protocol: TCP
  selector:
    app: model-in-image

---
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: model-in-image
  namespace: model-in-image
  labels:
    app: model-in-image
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: model-in-image
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

위 매니페스트를 통해 추론 모듈의 포트 번호를 800으로 내부 네트워크를 열어두고, 추론 모듈로 가동시킬 도커 이미지는 `imagePullPolicy:Always`로 기동 시 매번 이미지를 pull하고, 모델이 업데이트되어도 같은 이미지 이름으로 받아 기동할 수 있도록 설정합니다.

이제 `kubectl`  명령어를 통해 웹 API를 배포합니다.

```bash
kubectl apply -f manifests/namespace.yml
```

그리고 클러스터 내부의 엔드포인트에 포트를 포워딩합니다.

```bash
kubectl \
  -n model-in-image port-forward \
  deployment.apps/model-in-image \
  8000:8000 & 
```

마지막으로 테스트 데이터에 대해 POST를 요청합니다.

```bash
curl \ 
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"data": [[1.0, 2.0, 3.0, 4.0]]}' \
  localhost:8000/predict
```

## 장점

장점을 요약하자면 다음과 같습니다.

- 가동 확인이 끝난 서버와 모델의 관리를 하나의 추론용 서버 이미지를 통해 할 수 있음
- 서버와 모델을 일대일 대응으로 관리할 수 있어 운용상 이점이 있음

## 검토사항

모델-인-이미지 패턴은 학습한 모델의 수만큼 서버 이미지의 수도 늘어나는 구조입니다. 따라서 모델이 늘어날 수록 필요한 저장소 용량도 증가하게 됩니다. 불필요한 서버 이미지를 삭제하지 않으면 스토리지 비용이 증가하기 때문에 정기적으로 이미지를 삭제하는 것이 좋습니다. 특히 이미지 빌드 시 도커 캐시를 많이 사용하는 경우 시스템에서 소비하는 용량이 많기 때문에 다음 명령어를 통해 정리하는 것도 좋습니다.

```bash
docker system prune
```

결과적으로 **모델-인-이미지 패턴에서 해결해야 하는 문제는 서버 이미지의 사이즈가 증가함에 따라 발생하는 스토리지의 비용과 스케일 아웃의 지연**이 됩니다.
