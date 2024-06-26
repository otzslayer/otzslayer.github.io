---
title: 모델 배포 - 배치 학습 패턴
layout: post
tags: [batch-training-pattern, ml-system-design-pattern, ml-pipeline, crontab]
category: ML System Design Pattern
image:
  path: https://i.imgur.com/9APrFxF.png
  alt: 
---

## 유스케이스

ML 모델은 일반적으로 학습한 직후에 추론을 수행하였을 때 그 성능이 가장 좋습니다. 하지만 시간이 흐름에 따라 그 성능이 낮아지는 경우가 잦기 때문에 최신 데이터를 사용하여 모델을 재학습하는 경우가 많습니다. 이때 모델을 재학습하는 주기를 정하는 것도 중요한데 **배치 학습 패턴은 ML 모델의 학습을 정기적으로 실행하고 싶은 경우**에 사용하게 됩니다.

특정 계절, 시기에 최적화된 모델의 경우나 최신 데이터의 경향을 꾸준히 반영하도록 학습하는 것이 중요한 경우에는 더욱 재학습의 중요도가 높아지는데, 그렇다고 해서 매번 수동으로 모델 학습을 수행하는 것은 비효율적입니다. 따라서 이런 경우에 정기적인 배치 단위로 학습을 수행하는 것이 올바르다고 말할 수 있습니다.

## 아키텍처

![](https://i.imgur.com/qIsCS3z.png){: w="600"}

배치 학습 패턴은 모델의 학습을 자동화할 때 가장 전형적인 패턴이며 아키텍처는 위 그림과 같습니다. 위에서 언급했듯이 ML 모델을 정기적으로 갱신하고자 할 때 배치 학습 패턴이 매우 유용합니다. 학습을 하나의 작업으로 정의한 다음 `cron` 같은 스케줄링 시스템이나 작업 관리 서버 내에서 실행 조건 등록을 통해 작업을 실행할 수 있습니다. 저는 리눅스에서 가장 간단한 구성 방법인 `cron`을 개인적으로 선호합니다. 퍼블릭 클라우드라면 각 클라우드에서 제공하는 서비스를 활용할 수도 있습니다. 

### 구현

`cron`을 기준으로 설명하자면 학습 작업을 하나의 쉘 스크립트로 만들고 그 쉘 스크립트를 `cron`으로 실행합니다. 저는 프로젝트 수행 시 대부분의 작업을 Docker나 Pyenv + Pipenv 또는 Pyenv + PDM 을 사용하는데 [관련된 포스트](https://otzslayer.github.io/python/2023/03/15/run-pipenv-virtualenv-in-crontab.html)를 참고하시면 도움이 될 것 같습니다.

`cron` 문법은 매우 단순합니다.

```
* * * * * COMMAND
```

처음 다섯 개의 `*`는 각각 분(0~59), 시간(0~23), 일(1~31), 월(1~12), 요일(0~6)을 의미합니다. 이때 요일에서 0은 일요일, 7은 토요일입니다. 그 다음 마지막에 실행하고자 하는 명령어를 입력하면 됩니다. 예를 들어 매월 1일 새벽 5시에 특정 명령을 내린다면 다음과 같이 작성할 수 있습니다.

```
0 5 1 * * COMMAND
```

이를 통해 학습 파이프라인이나 특정 학습 작업을 정기적으로 실행할 수 있습니다.

## 장단점

정기적인 재학습과 모델 업데이트를 통해서 모델의 성능을 계속 유지할 수 있다는 장점이 있습니다. 하지만 작업 시 에러 사항을 고려해야 하고 완전한 자동 워크플로우를 만드는 데에 한계가 있습니다.

## 검토사항

일반적인 ML의 학습 파이프라인은 다음의 과정을 포함합니다.

> 1. 데이터 수집
> 2. 데이터 전처리
> 3. 모델 학습
> 4. 모델 평가
> 5. 예측 서버에 모델 빌드
> 6. 모델, 추론 모듈, 평가 결과 기록
{:.prompt-info}

만약 추론 모델을 항상 최신으로 유지해야 하는 경우엔 오류 발생 시 즉시 재시도 하거나 운영자에게 알려야 합니다. 하지만 그렇지 않은 경우 에러를 통보한 후 나중에 수동으로 재시도하면 됩니다. 이때 에러가 발생한 부분을 기록하여 에러 로그로부터 트러블슈팅과 복구를 할 수 있게 대응을 해야 합니다. 위의 각 단계의 어디에서 에러가 발생했느냐에 따라서 대응 방법도 달라집니다.

데이터 전처리부터 모델 평가까지의 작업에서는 모델의 성능이 요구되는 서비스 수준을 충족하지 못하는 경우가 발생할 수 있습니다. 이때는 전처리 방법이나 하이퍼파라미터의 설정을 변경해야 하기 때문에 추가적인 데이터 분석이나 모델 튜닝이 필요합니다.

그 다음 단계부터는 시스템 장애가 원인일 수 있습니다. 이때는 시스템 구성 요소인 서버, 스토리지, 데이터베이스, 네트워크, 미들웨어, 라이브러리 등의 장애 로그를 확인할 필요가 있습니다.
