---
title: Python 로깅 멋지게 하기
tags: [python, logging]
category: Python
layout: post
---

Python으로 `print()`로 로깅하는 것보다 멋진 방법이 있습니다.

<!--more-->

## 🧐 Logging?

파이썬 공식 문서에서 설명하는 로깅은 다음과 같습니다.

> 로깅은 **어떤 소프트웨어가 실행될 때 발생하는 이벤트를 추적하는 수단**입니다. 소프트웨어 개발자는 코드에 로깅 호출을 추가하여 특정 이벤트가 발생했음을 나타냅니다. 이벤트는 선택적으로 가변 데이터 (즉, 이벤트 발생마다 잠재적으로 다른 데이터)를 포함할 수 있는 설명 메시지로 기술됩니다. 이벤트는 또한 개발자가 이벤트에 부여한 중요도를 가지고 있습니다; 중요도는 *수준(level)* 또는 *심각도(severity)* 라고도 부를 수 있습니다. [(Reference)](https://docs.python.org/ko/3/howto/logging.html)

## 👍 Print 보다 Logging

작업하는 코드가 길어지고 복잡해질 수록 올바른 로그를 작성하는 것이 매우 중요해집니다. 코드를 디버깅할 때 뿐만 아니라 애플리케이션의 이슈와 성능에 대해 많은 것을 알아낼 때 큰 도움이 됩니다. **데이터 사이언티스트들에게도 예외는 아닙니다.** 아래의 경우에서 로깅의 중요성이 드러납니다.

- 실험의 수가 매우 많아 관리가 어려울 때
- ML 모델의 성능을 관리할 때
- 전체 코드의 성능을 파악할 때

하지만 많은 사람들이 위와 같은 작업을 할 때 단순히 `print()` 를 이용해서 결과를 출력합니다. 몇몇은 `file.write()`를 이용하기도 합니다. 단순히 한 번만 결과를 얻는 것이라면 괜찮지만, 여러 번 실험을 수행하거나 모델을 실행해서 결과를 얻게 되면 지금까지의 결과를 기록하기 위해 별도로 문서를 작성해야 합니다. 실험을 자동화하여 결과를 얻기도 어려운데다 불필요하게 시간을 낭비하게 됩니다.

파이썬에서는 대개 `logging` 이라는 STL을 이용해서 로그를 작성합니다. 잘 설정하여 사용하면 제법 강력한 기능을 갖고 있습니다. 하지만 스트림(Stream)되어 나오는 결과물은 너무 밋밋합니다. ''보기 좋은 떡이 먹기도 좋다'는 속담을 생각해보면 `logging`을 이용하여 얻는 메시지는 먹기 불편한 떡이죠. 그래서 본 글에서는 **`logging`과 함께 `rich`라는 라이브러리를 함께 소개드리고자 합니다.**


## 🪓 로깅 하기

### 🛒 준비

필요한 라이브러리는 `rich` 하나입니다.

```bash
pip install rich
```

올바르게 설치 되었는지 확인하기 위해 아래 명령어를 실행합니다.

```bash
python -m rich
```

![](/assets/images/2021-10-18-python-logging-with-rich/logging_rich.png)


### 📖 로깅 이해하기

#### 로깅 레벨

로깅 레벨은 개발 중 발생할 수 있는 이벤트에 대한 로그 메시지의 중요 수준을 의미합니다. 예를 들어서 "주의(Warn)"보다는 "오류(Error)"가 더 긴급한 내용일겁니다.


| 수준       | 사용 시점                                                    |
| ---------- | ------------------------------------------------------------ |
| `NOTSET`   |                                                              |
| `DEBUG`    | 상세한 정보. 보통 문제를 진단할 때만 필요합니다.             |
| `INFO`     | 예상대로 작동하는지에 대한 확인.                             |
| `WARNING`  | 예상치 못한 일이 발생했거나 가까운 미래에 발생할 문제(예를 들어 〈디스크 공간 부족〉)에 대한 표시. 소프트웨어는 여전히 예상대로 작동합니다. |
| `ERROR`    | 더욱 심각한 문제로 인해, 소프트웨어가 일부 기능을 수행하지 못했습니다. |
| `CRITICAL` | 심각한 에러. 프로그램 자체가 계속 실행되지 않을 수 있음을 나타냅니다. |



실제 `logging` 모듈을 사용할 때는 로그 메시지를 출력할 최소 수준을 설정합니다. 기본 수준은 `WARNING`이지만 일반적으로 `DEBUG` 수준까지의 로깅도 자주 하게 됩니다.

![](/assets/images/2021-10-18-python-logging-with-rich/logging_log_level.png)

#### 로깅 포맷

`logging` 모듈을 사용할 때에는 로깅 메시지의 포맷을 커스터마이징 할 수 있습니다. 포매팅을 통해 원하는 정보들을 얻어낼 수 있습니다. 사용 가능한 어트리뷰트는 [공식 문서](https://docs.python.org/ko/3/library/logging.html#logrecord-attributes)에 자세히 나와있습니다. 예를 들어 실행 시간, 로그 메시지의 중요 수준, 실행되고 있는 함수, 행 번호, 로그 메시지를 로깅한다면 그 포맷은 아래와 같습니다.

```python
"%(asctime)s - %(levelname)s — %(funcName)s:%(lineno)d — %(message)s"

# 위 포매팅 설정 결과는 아래와 같습니다.
# 2021-07-01 12:29:53,182 - INFO - <module>:1 - hello world
```

#### 로깅 핸들러

핸들러(Handler)는 로깅 메시지를 특정 대상으로 전달하는 수단입니다. `logging` 모듈을 통해 생성하는 `Logger` 객체에 원하는 만큼의 핸들러를 추가할 수 있습니다. 각각의 핸들러에는 별도의 설정을 통해 다른 포맷의 메시지를 전달할 수도 있습니다. 일반적으로 많이 사용하는 핸들러는 `FileHandler`와 `StreamHandler` 입니다.

- `FileHandler` : 디스크 내 파일에 로깅 메시지를 전달하여 저장합니다.
- `StreamHandler` : 스트림(ex. 콘솔창)에 로그 메시지를 전달해 출력합니다.

본 글에서는 `rich` 모듈을 이용하여 `StreamHandler`를 대체합니다.

### 💻 로깅 사용해보기

다음의 순서로 로거 인스턴스를 생성해보겠습니다.

1. 콘솔에 출력될 StreamHandler로 rich 모듈의 RichHandler를 추가합니다.
    - RichHandler는 기본적으로 로깅 시간과 로깅 수준이 출력되므로 나머지 어트리뷰트만 출력하도록 합니다.
2. 특정 경로에 저장하는 FileHandler를 추가합니다.
    - FileHandler는 로깅 시간, 로깅 수준, 파일명, 함수명, 행 번호, 메시지를 저장하도록 합니다.

위 순서대로 로거 인스턴스를 정의하는 함수를 작성해 보겠습니다. 로거의 로깅 기본 수준은  `NOTSET` 으로 설정하겠습니다.

{% highlight python linenos %}
import logging
import logging.handlers

from rich.logging import RichHandler

RICH_FORMAT = "[%(filename)s:%(lineno)s] >> %(message)s"
FILE_HANDLER_FORMAT = "[%(asctime)s]\\t%(levelname)s\\t[%(filename)s:%(funcName)s:%(lineno)s]\\t>> %(message)s"

def set_logger(log_path) -> logging.Logger:
    logging.basicConfig(
        level="NOTSET",
        format=RICH_FORMAT,
        handlers=[RichHandler(rich_tracebacks=True)]
    )
    logger = logging.getLogger("rich")

    file_handler = logging.FileHandler(log_path, mode="a", encoding="utf-8")
    file_handler.setFormatter(logging.Formatter(FILE_HANDLER_FORMAT))
    logger.addHandler(file_handler)

    return logger
{% endhighlight %}

- Line 6 : `RichHandler`를 위한 포맷
- Line 7 : `FileHandler`를 위한 포맷
- Line 10 ~ 14 : `logging.basicConfig()` 에서 로거 기본 설정을 합니다. `RichHandler`로 설정하면 됩니다.
    - Line 13 : `RichHandler`의 `rich_tracebacks` 인자는 `True`일 때 오류 발생 시 Traceback을 멋지게 보여줍니다.
- Line 15 : 기본 설정한 `RichHandler`로 로거 인스턴스를 우선 생성합니다.
- Line 17 ~ 19 : `FileHandler`를 생성/추가합니다.
    - Line 17 : `mode=="a"`로 로그 파일에 새로운 로깅 메시지를 append 하도록 합니다.
    - Line 19 : 로거 인스턴스에 `FileHandler`를 추가합니다.

이렇게 생성한 로거 인스턴스를 적용하여 아래 메인 함수를 실행해보겠습니다.

```python
logger = set_logger()

for i in range(3, -1, -1):
    try:
        num = 1/i
    except:
        raise ZeroDivisionError()
    logger.info(f"1/{i} = {num}")
```

역수를 계산하고 분모가 0인 경우는 오류가 발생하도록 했습니다. 계산이 올바르게 되는 경우는 로깅 메시지를 출력/저장하도록 했습니다. 위 코드를 실행하면 아래와 같이 결과가 나옵니다.

![](/assets/images/2021-10-18-python-logging-with-rich/logging_rich_example1.png)

그런데 저장한 로그 파일을 확인해보면 무언가 하나 부족해보입니다.

```bash
$ cat log.log
[2021-07-01 23:27:31,152]	INFO	[logger_example.py:<module>:41]	>> 1/3 = 0.3333333333333333
[2021-07-01 23:27:31,161]	INFO	[logger_example.py:<module>:41]	>> 1/2 = 0.5
[2021-07-01 23:27:31,163]	INFO	[logger_example.py:<module>:41]	>> 1/1 = 1.0
```

발생한 오류에 대한 메시지가 저장이 되지 않았습니다. 사실 터미널을 보아도 `rich` 모듈을 통해서 오류 메시지가 출력되지 않았습니다. 실제 `logging` 모듈을 사용할 때 자주 겪게 되는 현상입니다. 예외처리를 할 때 `logger.error()`를 통해 별도로 로깅 메시지를 저장/출력해야지만 원하는 결과를 얻을 수 있습니다. 문제는 전체 코드 중 어디에서 오류가 발생할 지 모르기 때문에 `try except` 구문을 전체 코드에 걸어야 한다는 점입니다. 이런 문제를 해결하기 위해서는 아래 트릭을 사용해야 합니다.

{% highlight python linenos %}
import sys

def handle_exception(exc_type, exc_value, exc_traceback):
    logger = logging.getLogger("rich")

    logger.error("Unexpected exception",
                 exc_info=(exc_type, exc_value, exc_traceback))

if __name__ == "__main__":
    logger = set_logger()
    sys.excepthook = handle_exception

    for i in range(3, -1, -1):
        try:
            num = 1/i
        except:
            raise ZeroDivisionError()
        logger.info(f"1/{i} = {num}")
{% endhighlight %}

오류가 발생했을 때 그 내용을 `RichHandler`에서 가져갈 수 있도록 설정하는 것 (Line 3 ~ 7)입니다. 해당 함수를 `sys.excepthook`에 설정하고 메인 함수를 실행시키면 아까와 다른 결과를 얻을 수 있습니다.

![](/assets/images/2021-10-18-python-logging-with-rich/logging_rich_example2.png)

아까와 다르게 오류 내용이 `RichHandler`를 통해 멋지게 출력되는 것을 볼 수 있습니다. `FileHandler`를 통해 저장된 파일을 봐도 로깅 메시지가 추가 되었습니다.

```bash
$ cat log.log
[2021-07-01 23:37:59,576]	INFO	[logger_example.py:<module>:41]	>> 1/3 = 0.3333333333333333
[2021-07-01 23:37:59,583]	INFO	[logger_example.py:<module>:41]	>> 1/2 = 0.5
[2021-07-01 23:37:59,585]	INFO	[logger_example.py:<module>:41]	>> 1/1 = 1.0
[2021-07-01 23:37:59,587]	ERROR	[logger_example.py:handle_exception:28]	>> Unexpected exception
Traceback (most recent call last):
  File "/Users/Han/Desktop/Articles/Jun 30, 2021/logger_example.py", line 38, in <module>
    num = 1/i
ZeroDivisionError: division by zero

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  File "/Users/Han/Desktop/Articles/Jun 30, 2021/logger_example.py", line 40, in <module>
    raise ZeroDivisionError()
ZeroDivisionError
```

위의 모든 내용을 포함한 코드를 첨부해드립니다.

```python
import sys
import logging
import logging.handlers

from rich.logging import RichHandler

LOG_PATH = "./log.log"
RICH_FORMAT = "[%(filename)s:%(lineno)s] >> %(message)s"
FILE_HANDLER_FORMAT = "[%(asctime)s]\\t%(levelname)s\\t[%(filename)s:%(funcName)s:%(lineno)s]\\t>> %(message)s"

def set_logger() -> logging.Logger:
    logging.basicConfig(
        level="NOTSET",
        format=RICH_FORMAT,
        handlers=[RichHandler(rich_tracebacks=True)]
    )
    logger = logging.getLogger("rich")

    file_handler = logging.FileHandler(LOG_PATH, mode="a", encoding="utf-8")
    file_handler.setFormatter(logging.Formatter(FILE_HANDLER_FORMAT))
    logger.addHandler(file_handler)

    return logger

def handle_exception(exc_type, exc_value, exc_traceback):
    logger = logging.getLogger("rich")

    logger.error("Unexpected exception",
                 exc_info=(exc_type, exc_value, exc_traceback))

if __name__ == "__main__":
    logger = set_logger()
    sys.excepthook = handle_exception

    for i in range(3, -1, -1):
        num = 1/i
        logger.info(f"1/{i} = {num}")

```

## **📚 References**

[Python Logging: An In-Depth Tutorial](https://www.toptal.com/python/in-depth-python-logging)

[How to Run Machine Learning Experiments with Python Logging module](https://medium.com/analytics-vidhya/how-to-run-machine-learning-experiments-with-python-logging-module-9030fbee120e)

[willmcgugan/rich](https://github.com/willmcgugan/rich)