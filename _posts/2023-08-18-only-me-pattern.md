---
title: 모델 생성 - Only Me 패턴
layout: post
tags: [only-me-pattern, ml-system-design-pattern, pipenv, poetry, pdm]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---



시부이 유우스케의 머신러닝 시스템 디자인 패턴 책을 읽으면서 제 업무에 도움이 될만한 디자인 패턴을 정리하여 포스팅합니다. 

---

## 상황

ML 모델을 개발할 때 주로 하는 일은 데이터 분석과 실험, 그리고 개발입니다. 그리고 ML 모델 개발에서 가장 중요한 요소는 **재현성(reproducibility)** 입니다. 하지만 ML 엔지니어가  개인 환경에서 개발을 진행하는 경우 다른 사람이 해당 모델을 재현하는 것이 불가능한 경우가 매우 많습니다. 또는 모델 개발을 위한 설정이나 데이터셋을 공개하지 않아 재현하기 어려운 경우도 발생합니다.

## 구체적인 시나리오

우리는 ML 모델의 빠른 프로토타이핑을 위해 개인 환경에서 주피터 노트북으로 개발하는 경우가 매우 흔합니다. 쉽게 개발할 수 있고 쉽게 실험할 수 있다는 큰 장점을 가지고 있지만 다른 사용자나 개발자가 재현하기 어렵다는 커다란 단점을 안고 있습니다. 게다가 간혹 라이브러리 버전이 달라 **의존성 충돌** 문제가 발생하기도 합니다. 이런 상황을 피하기 위해서는 상세한 모델 개발 환경을 모두에게 공유하는 것이 중요합니다.

![](https://i.imgur.com/F0zZUsz.png)

여기에서 다루는 Only me 패턴은 대표적인 안티 패턴으로 ML 모델을 개발한 ML 엔지니어의 개인 환경에 강하게 의존하여 생기는 패턴입니다. 물론 이 패턴에 장점이 없는 것은 아닙니다. ML 엔지니어가 자신의 개인 환경에서 빠르게 개발이 가능하다는 것이 장점입니다. 하지만 **모델을 실제 운영 환경이나 다른 개발자의 환경에서 정상적으로 확인하거나 재현하기 어렵다는 큰 단점**이 있습니다.

## 회피 방법

- 도커와 같은 도구를 활용하여 동일한 개발 환경을 보장 받으면 됩니다.
- 도커의 사용을 어려워하는 경우 Pipenv,  Poetry, PDM 등 개발 환경의 파이썬 라이브러리 버전을 관리해주는 도구를 사용할 수도 있습니다.
- 개발한 프로그램을 GitHub 등의 저장소에서 관리하면서 코드 리뷰를 실시하면 좋습니다.
