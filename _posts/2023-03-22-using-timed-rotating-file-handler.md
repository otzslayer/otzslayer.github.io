---
title: Python에서 TimedRotatingFileHandler 활용하기
tags: [python, logging, time-rotating]
category: Python
aside:
  toc: true
show_category: true
---


<!--more-->

## 들어가며

어떤 ML 모델을 만들어서 운영 환경에 올리고 날마다 데이터, 모델, 메트릭에 대한 로그를 쌓는다고 가정해봅시다. 작은 시스템이라면 괜찮겠지만 제법 규모가 크고 로그에 쌓이는 내용이 많다면 길게는 하루, 짧게는 시간 단위로 로그 파일을 따로 관리해야 할 수도 있습니다. 특정 시간 간격으로 로그 파일을 새로 저장하거나 오래된 로그는 지우는 등 다양한 방법으로 관리를 할 수 있는데요. 이런 작업을 직접 하거나 쉘 스크립트로 자동화하는 것이 아닌 Python `logging` 기본 라이브러리에 있는 클래스를 이용하여 할 수 있습니다.

## `TimedRotatingFileHandler`

### 그게 뭐지?

보통 `logging` 라이브러리를 많이 쓰시는 분들도 `StreamHandler`와 `FileHandler`를 제외한 다른 핸들러는 많이 안써보셨을거라고 생각합니다. 물론 저도 그 중 한 명입니다. `TimedRotatingFileHandler`는 이름에서 알 수 있듯이 특정 시간 간격으로 디스크 내에 적재하는 로그 파일을 순환하여 관리하는 핸들러입니다. 

### 사용법

```python
class TimedRotatingFileHandler(filename, 
                               when='h', 
                               interval=1,
                               backupCount=0,
                               encoding=None,
                               delay=False,
                               utc=False,
                               atTime=None,
                               errors=None
)
```

기본적으로 `filename`엔 저장할 로그 파일명을 입력하면 됩니다. 중요한 인자는 `when`과 `interval`, `backupCount` 입니다.

- `when`과 `interval`은 조합하여 사용한다고 생각하면 편합니다.
	- `when`은 일반적인 strftime 형식(`%Y-%m-%d %H:%M:%S`)에서 일 단위부터 초 단위까지 사용이 가능합니다.
		- 추가로 `W0`부터 `W6`을 설정할 수 있습니다. 월요일부터 일요일입니다.
		- `when="midnight"` 으로 설정하고 `atTime`을 설정하지 않는다면 매일 자정에 새로운 로그 파일이 갱신됩니다.
	- `interval`은 간격입니다.
		- 만약 `when = "d"`, `interval=10` 이라면 생성한 `TimedRotatingFileHandler`는 10일 간격으로 파일을 새로 생성합니다.
- `backupCount`는 보관하는 로그 파일의 총 개수입니다.
	- `backupCount=30` 이라면 최대 30개의 파일을 저장합니다. 가장 오래된 파일부터 삭제합니다.

새로운 로그 파일이 생성되고 기존 로그 파일은 백업되는데, 이때 파일명의 포맷을 지정할 수 있습니다. 위 설명대로 매일 자정마다 새로 로그 파일이 생성되는 `TimedRotatingFileHandler`를 만들었다고 가정하겠습니다.

```python
import logging

trf_handler = logging.handlers.TimedRotatingFileHandler(
    filename="log.log", when="midnight", interval=1, backupCount=30
)
```

새로 생성한 `trf_handler`에 `suffix`를 지정하면 됩니다. 만약 백업할 때 파일명 뒤에 날짜(YYYY-MM-DD)를 붙이고 싶다면 아래와 같이 하면 됩니다.

```python
trf_handler.suffix = "-%Y%m%d"
```

그러면 매일 자정 새로운 로그 파일 생성과 함께 기존 로그 파일은 `log.log-YYYY-MM-DD` 형태로 저장이 됩니다.

## 나가며

이번 포스트에선 `TimedRotatingFileHandler`만 설명했지만 특정 시간 간격이 아닌 파일 용량을 기준으로 파일을 백업하는 `RotatingFileHandler`도 있습니다. 자세한 설명은 다음 페이지를 [참고](https://docs.python.org/ko/3/library/logging.handlers.html#rotatingfilehandler)하시기 바랍니다.

과거에 이 핸들러를 몰랐을 때는 쉘 스크립트에 직접 명령어를 입력했었는데, 왜 더 자세히 찾아보지 않았나 하는 생각이 들었습니다. 작동은 올바르게 했지만 기본 기능이 있다면 쓰는게 좋으니까요. 로깅 관련해서는 과거에 포스팅한 몇몇 글을 더 살펴보시는 것도 좋을 듯 합니다. 😄
- [Python 로깅 멋지게 하기](https://otzslayer.github.io/python/2021/10/18/python-logging-with-rich.html)
- [Python에서 Uncaught Exception 로깅하는 법](https://otzslayer.github.io/python/2021/11/26/logging-uncaught-exception-in-python.html)