---
title: 버전 불일치 패턴
layout: post
tags: [dependency-conflict-pattern, ml-system-design-pattern, docker, onnx]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

## 상황

ML 모델을 운영 환경에 이관할 때 학습 환경과 추론 환경 사이에 차이가 발생하지 않도록 하는 것이 중요합니다. 같은 라이브러리를 사용하더라도 버전에 따라 사용 가능한 클래스나 함수에 차이가 발생하기 때문입니다. 버전 불일치 패턴은 다음과 같은 상황에서 발생합니다.

- 학습 환경과 추론 환경에서 같은 라이브러리를 사용하고 있으나 라이브러리의 버전이 일치하지 않는 상황
- 추론 모듈에서 모델을 불러올 수 없는 경우
- 추론 환경에서 추론 결과가 학습 환경에서 예상했던 추론 결과와 일치하지 않는 경우

## 구체적인 시나리오

![](https://i.imgur.com/S8zPhVQ.png){: w="600"}


학습 환경에서 빌드한 모델을 추론 모듈에 포함할 때 학습 환경과 추론 환경에서 사용하는 언어와 라이브러리의 버전을 맞는 것은 매우 중요합니다. 당연히 파이썬 2와 파이썬 3은 서로 호환이 안되는 부분이 존재하기 때문에 문제가 발생하지 않도록 버전을 맞춰야 합니다. 같은 파이썬 3이더라도 마이너 버전에 따라 지원하는 기능이 다르므로 잘 확인해야 합니다.

이런 부분은 라이브러리에선 더욱 중요합니다. 예를 들어 `scikit-learn`의 특정 버전에서 학습한 모델을 더 최신 버전의 모델이나 이전 버전의 모델의 `scikit-learn`에서 불러온다면 문제가 생길 수도 있습니다. 

이외에도 **텐서플로우는 1.X 버전과 2.X 버전의 API 차이가 매우 큰데요.**  `tensorflow.keras` 는 두 버전 사이에 큰 차이가 발생했었고, `tensorflow.lite.TFLiteConverter` 같은 클래스는 1.X 에선 지원하지만 2.X 버전에선 일부 연산을 지원하지 않기도 합니다. 최근에는 [ONNX](https://onnx.ai/)를 사용하여 호환성 문제를 해결하려는 노력도 있습니다만 완벽하게 문제를 해결하지는 못한다는 이야기도 있습니다.

단순히 모델과 관련 라이브러리뿐만 아니라 `pandas`나 `SQLAlchemy` 같은 라이브러리도 최근 1.X 버전에서 2.X 버전으로 업데이트하면서 많은 API에 변경이 이루어졌습니다. **심지어 두 라이브러리 사이에서 활용되는 API에도 큰 변화가 있어 많은 의존성 문제를 야기한 바 있습니다.**

또 다른 시나리오로는 개발이 활발한 오픈 소스가 있습니다. `LangChain` 같이 업데이트의 주기가 매우 짧은 라이브러리는 하루에 많으면 두 번씩 새로운 버전이 릴리즈됩니다. 이런 경우 당장 어제 활용했던 API가 오늘엔 작동하지 않을 수 있습니다. 이런 경우에는 라이브러리의 버전을 확실하게 지정하는 것이 좋습니다.

이런 문제를 완화하기 위해서는 학습 환경과 추론 환경에서 공통으로 사용하는 라이브러리는 버전까지 포함하여 관리하는 것이 좋습니다. [파이썬 의존성 관리 도구 PDM](https://otzslayer.github.io/python/2023/06/28/pdm-python-dependency-manager.html) 포스트에서 관련 정보를 더 자세히 확인하실 수 있습니다. Poetry나 PDM 같은 의존성 관리 도구를 사용하지 않는다면 `pip`를 이용해서 라이브러리 목록을 뽑을 수 있습니다.

```shell
pip list freeze > requirements.txt
```

물론 이 방법을 이용하면 개발 환경에서만 사용하는 라이브러리도 포함됩니다. 따라서 필요에 따라 개발 환경에서만 사용하는 라이브러리는 제거할 수 있습니다.