---
title: BentoML에서 Input에 다양한 타입이 필요한 경우 (Pydantic 활용)
tags: [bentoml, serving, pydantic]
category: MLOps
layout: post
---


<!--more-->

## 들어가며

<center>
  <figure>
    <img src="https://i.imgur.com/A7dwPi7.png" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Photo from <a href="https://realpython.com/python-data-types/">Here</a></figcaption>
  </figure>
</center>

개인적으로 ML 모델을 서빙할 때 [BentoML](https://docs.bentoml.org/)을 많이 사용합니다. 빠르고 다양한 모델을 지원하고 간단한 서빙이 가능하기 때문입니다. 보통 이미지나 텍스트를 모델의 인풋으로 하는 경우 BentoML에서는 각각 `bentoml.io.Image`나 `bentoml.io.Text`를 활용하여 데이터를 받습니다. 하지만 일반적인 ML 모델은 tabular data 형태의 데이터를 받게 됩니다. 이 경우 보통 하나의 데이터 행을 받게 되는데 데이터 타입이 모두 같은 경우엔 간단하게`bentoml.io.NumpyNdarray`로 받으면 됩니다. 그러나 보통은 여러 데이터 타입이 공존하는 경우가 많습니다. 수치형 변수뿐만 아니라 범주형 변수도 필요한 경우가 생기니까요. 이번 포스트에서는 이 경우에 Pydantic으로 데이터 타입 클래스를 정의하여 문제를 해결하는 방법에 대해 알아보도록 하겠습니다.

## 해결법

위에서는 범주형 변수에 대해서 이야기했지만 보다 단순하게 문제를 바라보기 위해서 단순 수치형 값만 받게 된다고 가정하겠습니다. 이 경우 언급했듯이 `bentoml.io.NumpyNdarray`를 사용하면 되지만 이번엔 데이터 프레임에서 하나의 행을 입력으로 받는다고 사정하겠습니다.

### Pydantic

<center>
  <figure>
    <img src="https://i.imgur.com/S5UEZl2.png" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Pydantic</figcaption>
  </figure>
</center>

**Pydantic**은 파이썬 타입 어노테이션을 사용한 데이터 유효성 검사와 설정 관리를 제공합니다. 많은 분들이 비슷한 기능으로 데이터 클래스를 알고 계시지만 데이터 클래스는 타입 어노테이션만 할 뿐 유효성 검사를 하지 않습니다. 따라서 이런 문제가 발생할 수 있습니다.

```python
from dataclasses import dataclass

@dataclass
class Person:
    name: str
    age: int

right_person = Person(name="John Doe", age=30)
wrong_person = Person(name="James Dean", age="Died")
```

분명 나이는 정수를 받지만 `wrong_person`에서 문자열을 받았음에도 오류가 발생하지 않습니다. Pydantic은 타입에 대한 유효성 검사를 진행하기 때문에 이 경우 에러를 발생시킵니다. 물론 이런 점 때문에 데이터 클래스보단 느리다는 의견도 종종 있습니다. 😉

위 코드를 Pydantic으로 쓴다면 이렇게 됩니다.

```python
from pydantic import BaseModel

class Person(BaseModel):
    name: str
    age: int

person = Person(name="John Doe", age=30)
person2 = Person(name="John Smith", age="50")
```

재밌는건 `person2`를 생성할 때 나이를 문자열로 `"50"`이라고 했지만 알아서 숫자로 파싱합니다.

### 다시 BentoML로 돌아가서

Iris 데이터를 이용해서 종류를 분류하는 간단한 분류 모델을 만들었다고 가정하겠습니다. BentoML을 이용해서 이 모델을 서빙할 건데요. Pydantic을 이용해서 데이터 클래스를 정의하여 다음과 같이 코드를 작성할 수 있습니다.

```python
# service.py

import bentoml
import numpy as np
import pandas as pd
from bentoml.io import JSON, NumpyNdarray
from pydantic import BaseModel

iris_runner = bentoml.sklearn.get("iris_clf:latest").to_runner()
svc = bentoml.Service("iris_classifier", runners=[iris_runner])

class IrisFeatures(BaseModel):
    sepal_len: float
    sepal_width: float
    petal_len: float
    petal_width: float

@svc.api(input=JSON(pydantic_model=IrisFeatures), output=NumpyNdarray())
async def classify(input_data: IrisFeatures):
    input_df = pd.DataFrame([input_data.to_dict()])
    return await iris_runner.predict.run(input_df)
```

위처럼 서비스 코드를 작성하고 다음과 같이 터미널에서 `curl`을 날리면 결과를 얻을 수 있습니다.

```bash
curl -X POST -H "content-type: application/json" \
    --data '{"sepal_len": 6.2, "sepal_width": 3.2, "petal_len": 5.2, "petal_width": 2.2}' \
    http://127.0.0.1:3000/classify
```

만약 Python을 이용한다면 `requests` 라이브러리를 사용하면 됩니다.

```python
 import requests

 requests.post(
     "http://0.0.0.0:3000/predict",
     headers={"content-type": "application/json"},
     data='{"sepal_len": 6.2, "sepal_width": 3.2, "petal_len": 5.2, "petal_width": 2.2}'
 ).text
```

## 나가며

아무래도 하는 일의 특성상 텍스트나 이미지보다는 tabular data를 많이 사용하다 보니 MLOps를 만지작거리다 보면 생각보다 자료가 적다고 생각하게 됩니다. 아무래도 실제 서빙하게 되는 모델은 TensorFlow나 PyTorch를 활용한 딥러닝 모델이 대부분이고, 실제 전통적인 ML 모델들은 다소 뒷전이니까요. 그러다 보니 항상 간단하지만, 꼭 필요한 이 포스트 같은 내용을 정리해야겠다는 생각하고 있습니다. 😀