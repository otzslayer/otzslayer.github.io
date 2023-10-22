---
created: 2023-10-15
title: 추론 시스템 생성 - 동기 추론 패턴
layout: post
tags: [inference-system, mlops, synchronous]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

## 유스케이스

외부 클라이언트에서 웹 API로 추론 요청이 있을 때 처리하는 방법은 크게 동기 처리와 비동기 처리로 나뉩니다. **시스템의 워크플로우에서 추론 결과가 나올 때까지 다음 단계로 진행이 되지 않는 경우나 워크플로우가 추론 결과에 의존하는 경우** 동기 추론 패턴을 사용합니다.

가령 공장의 생산라인에서 제품의 이상을 검출하는 시스템을 생각해보면 조금 쉬운데요. 제품이 정상인 경우엔 출품 라인으로, 이상이 발견되면 사람이 확인하는 라인으로 내보내는 워크플로우를 갖고 있을 때 추론 결과에 따라 후속 처리가 결정되므로 요청에 동기화하여 추론해나가는 동기 추론 패턴을 사용하게 됩니다.

## 아키텍처

![](https://i.imgur.com/GaAt1Q3.png){: w="600"}

위에서 언급했듯이 동기 추론 패턴에서는 머신러닝의 추론을 동기적으로 처리합니다. 클라이언트는 추론 요청을 전송하고 응답을 얻을 때까지 후속 처리를 진행하지 않고 대기합니다. **추론 서버를 REST API나 gRPC로 구성한 경우** 동기 추론 패턴이 되는 경우가 많습니다.

동기 추론 패턴을 활용하면 **추론을 포함한 워크플로우를 순차적으로 만들 수 있고, 동시에 간단하게 유지**할 수 있습니다.

또한 ML의 추론 프로세스도 동기적인데, 데이터의 입력부터 전처리, 추론, 후처리, 출력까지 순차적으로 실행하게 됩니다. 따라서 중간 프로세스에 느린 처리가 있는 경우 전체 프로세스가 오래 걸린다는 문제가 있습니다.

## 구현

동기 추론 패턴의 구현은 웹 싱글 패턴과 거의 유사합니다. 아래 구현은 InceptionV3 모델을 사용하며 아래 코드는 Tensorflow Hub에 있는 `InceptionV3Model` 클래스를 사용하는데 다음과 같은 내용을 포함하고 있습니다.

> - 전처리: 이미지 데이터의 디코딩을 수행하며 `float32`로 변환, `(299, 299, 3)` 크기로 리사이징
> - 추론: 학습이 끝난 InceptionV3 모델을  활용
> - 후처리: 추론 결과에서 가장 확률이 높은 클래스를 취득하고 라벨 목록에서 라벨명을 출력
{:.prompt-info}

```python
# imagenet_inception_v3/extract_inception_v3.py

import json
from typing import List

import tensorflow as tf
import tensorflow_hub as hub


def get_label(json_path: str = "./image_net_labels.json") -> List[str]:
    with open(json_path, "r") as f:
        labels = json.load(f)
    return labels


def load_hub_model() -> tf.keras.Model:
    model = tf.keras.Sequential([hub.KerasLayer("https://tfhub.dev/google/imagenet/inception_v3/classification/4")])
    model.build([None, 299, 299, 3])
    return model


class InceptionV3Model(tf.keras.Model):
    def __init__(self, model: tf.keras.Model, labels: List[str]):
        super().__init__(self)
        self.model = model
        self.labels = labels

    @tf.function(input_signature=[tf.TensorSpec(shape=[None], dtype=tf.string, name="image")])
    def serving_fn(self, input_img: str) -> tf.Tensor:
        def _base64_to_array(img):
            img = tf.io.decode_base64(img)
            img = tf.io.decode_jpeg(img)
            img = tf.image.convert_image_dtype(img, tf.float32)
            img = tf.image.resize(img, (299, 299))
            img = tf.reshape(img, (299, 299, 3))
            return img

        img = tf.map_fn(_base64_to_array, input_img, dtype=tf.float32)
        predictions = self.model(img)

        def _convert_to_label(predictions):
            max_prob = tf.math.reduce_max(predictions)
            idx = tf.where(tf.equal(predictions, max_prob))
            label = tf.squeeze(tf.gather(self.labels, idx))
            return label

        return tf.map_fn(_convert_to_label, predictions, dtype=tf.string)

    def save(self, export_path="./saved_model/inception_v3/"):
        signatures = {"serving_default": self.serving_fn}
        tf.keras.backend.set_learning_phase(0)
        tf.saved_model.save(self, export_path, signatures=signatures)


def main():
    labels = get_label(json_path="./image_net_labels.json")
    inception_v3_hub_model = load_hub_model()
    inception_v3_model = InceptionV3Model(model=inception_v3_hub_model, labels=labels)
    version_number = 0
    inception_v3_model.save(export_path=f"./saved_model/inception_v3/{version_number}")


if __name__ == "__main__":
    main()
```

전체 과정은 `tf.saved_model`에 포함되어 출력되는데 `saved_model`은 TensorFlow Serving 이미지를 통해 추론 모듈로서 가동할 수 있습니다. 아래 Dockerfile은 `saved_model`을 불러오는 내용을 포함하고 있습니다.

```Dockerfile
# imagenet_inception_v3/Dockerfile

FROM tensorflow/tensorflow:2.5.1 as builder

ARG SERVER_DIR=imagenet_inception_v3
ENV PROJECT_DIR synchronous_pattern
WORKDIR /${PROJECT_DIR}
ADD ./${SERVER_DIR}/requirements.txt /${PROJECT_DIR}/
RUN apt-get -y update && \
    apt-get -y install apt-utils gcc && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    pip install  --no-cache-dir -r requirements.txt && \
    touch __init__.py

COPY ./${SERVER_DIR}/extract_inception_v3.py /${PROJECT_DIR}/extract_inception_v3.py
COPY ./${SERVER_DIR}/image_net_labels.json /${PROJECT_DIR}/image_net_labels.json

RUN python -m extract_inception_v3

# 여기까지 saved_model을 컨테이너에 ㅔ저장

FROM tensorflow/serving:2.5.2

ARG SERVER_DIR=imagenet_inception_v3
ENV PROJECT_DIR synchronous_pattern
ENV MODEL_BASE_PATH /${PROJECT_DIR}/saved_model/inception_v3
ENV MODEL_NAME inception_v3

COPY --from=builder /synchronous_pattern/saved_model/inception_v3 ${MODEL_BASE_PATH}
EXPOSE 8500
EXPOSE 8501

COPY ./${SERVER_DIR}/tf_serving_entrypoint.sh /usr/bin/tf_serving_entrypoint.sh
RUN chmod +x /usr/bin/tf_serving_entrypoint.sh
ENTRYPOINT ["/usr/bin/tf_serving_entrypoint.sh"]

# 여기까지 TF Serving 실행
```

아래 쉘 스크립트를 이용해 도커 컨테이너를 올립니다.

```bash
#!/bin/bash

set -eu

PORT=${PORT:-8500}
REST_API_PORT=${REST_API_PORT:-8501}
MODEL_NAME=${MODEL_NAME:-"inception_v3"}
MODEL_BASE_PATH=${MODEL_BASE_PATH:-"/synchronous_pattern/saved_model/${MODEL_NAME}"}

tensorflow_model_server \
    --port=${PORT} \
    --rest_api_port=${REST_API_PORT} \
    --model_name=${MODEL_NAME} \
    --model_base_path=${MODEL_BASE_PATH} 
```

아래 코드는 파이썬으로 [gRPC](https://medium.com/naver-cloud-platform/nbp-%EA%B8%B0%EC%88%A0-%EA%B2%BD%ED%97%98-%EC%8B%9C%EB%8C%80%EC%9D%98-%ED%9D%90%EB%A6%84-grpc-%EA%B9%8A%EA%B2%8C-%ED%8C%8C%EA%B3%A0%EB%93%A4%EA%B8%B0-1-39e97cb3460) 및 REST API에 추론 요청을 보내는 내용을 담고 있습니다.

```python
# client/request_inception_v3.py

import base64
import json

import click
import grpc
import numpy as np
import requests
import tensorflow as tf
from tensorflow_serving.apis import predict_pb2, prediction_service_pb2_grpc


def read_image(image_file: str = "./cat.jpg") -> bytes:
    with open(image_file, "rb") as f:
        raw_image = f.read()
    return raw_image


def request_grpc(
    image: bytes,
    model_spec_name: str = "inception_v3",
    signature_name: str = "serving_default",
    address: str = "localhost",
    port: int = 8500,
    timeout_second: int = 5,
) -> str:
    serving_address = f"{address}:{port}"
    channel = grpc.insecure_channel(serving_address)
    stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)
    base64_image = base64.urlsafe_b64encode(image)

    request = predict_pb2.PredictRequest()
    request.model_spec.name = model_spec_name
    request.model_spec.signature_name = signature_name
    request.inputs["image"].CopyFrom(tf.make_tensor_proto([base64_image]))
    response = stub.Predict(request, timeout_second)

    prediction = response.outputs["output_0"].string_val[0].decode("utf-8")
    return prediction


def request_rest(
    image: bytes,
    model_spec_name: str = "inception_v3",
    address: str = "localhost",
    port: int = 8501,
):
    serving_address = f"http://{address}:{port}/v1/models/{model_spec_name}:predict"
    headers = {"Content-Type": "application/json"}
    base64_image = base64.urlsafe_b64encode(image).decode("ascii")
    request_dict = {"inputs": {"image": [base64_image]}}
    response = requests.post(
        serving_address,
        json.dumps(request_dict),
        headers=headers,
    )
    return dict(response.json())["outputs"][0]


def request_metadata(
    model_spec_name: str = "inception_v3",
    address: str = "localhost",
    port: int = 8501,
):
    serving_address = f"http://{address}:{port}/v1/models/{model_spec_name}/versions/0/metadata"
    response = requests.get(serving_address)
    return response.json()


@click.command(name="inception v3 image classification")
@click.option(
    "--format",
    "-f",
    default="GRPC",
    type=str,
    help="GRPC or REST request",
)
@click.option(
    "--image_file",
    "-i",
    default="./cat.jpg",
    type=str,
    help="input image file path",
)
@click.option(
    "--target",
    "-t",
    default="localhost",
    type=str,
    help="target address",
)
@click.option(
    "--timeout_second",
    "-s",
    default=5,
    type=int,
    help="timeout in second",
)
@click.option(
    "--model_spec_name",
    "-m",
    default="inception_v3",
    type=str,
    help="model spec name",
)
@click.option(
    "--signature_name",
    "-n",
    default="serving_default",
    type=str,
    help="model signature name",
)
@click.option(
    "--metadata",
    is_flag=True,
)
def main(
    format: str,
    image_file: str,
    target: str,
    timeout_second: int,
    model_spec_name: str,
    signature_name: str,
    metadata: bool,
):

    if metadata:
        result = request_metadata(
            model_spec_name=model_spec_name,
            address=target,
            port=8501,
        )
        print(result)

    else:
        raw_image = read_image(image_file=image_file)

        if format.upper() == "GRPC":
            prediction = request_grpc(
                image=raw_image,
                model_spec_name=model_spec_name,
                signature_name=signature_name,
                address=target,
                port=8500,
                timeout_second=timeout_second,
            )
        elif format.upper() == "REST":
            prediction = request_rest(
                image=raw_image,
                model_spec_name=model_spec_name,
                address=target,
                port=8501,
            )
        else:
            raise ValueError("Undefined format; should be GRPC or REST")
        print(prediction)


if __name__ == "__main__":
    main()
```

이제 다음의 커맨드로 결과를 요청할 수 있습니다.

```bash
# GRPC 요청
$ python -m client.request_inception_v3 -f GRPC -i cat.jpb
Siamese cat

# REST API 요청
$ python -m client.request_inception_v3 -f REST -i cat.jpb
Siamese cat
```

이전 웹 싱글 패턴에서 구현했던 내용과의 차이점이라고 하면 웹 싱글 패턴에서는 웹 API를 FastAPI로 구현했지만 동기 추론 패턴에서는 TF Serving을 이용해 구현했다는 점입니다.

## 특징

동기 추론 패턴은 간단한 구성으로 개발과 운용이 용이하다는 장점이 있습니다. 또한 추론이 완료될 때까지 클라이언트가 다음 프로세스로 넘어가지 않기 때문에 순차적인 워크플로우를 만들 수 있습니다. 다만 추론 모듈이 응답할 때까지 클라이언트가 기다려야 한다는 치명적인 단점이 있습니다. 높은 사용자 경험을 위해서는 매우 낮은 지연 시간이 필수입니다. 따라서 클라이언트나 프락시에 타임아웃을 설정하여 허용 시간을 넘기면 더 이상 추론을 기다리지 않고 다음 프로세스로 넘어가는 방법도 검토할 수 있습니다.

