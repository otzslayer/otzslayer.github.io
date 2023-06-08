---
title: Python에서 Uncaught Exception 로깅하는 법
tags: [python, logging, exception]
category: Python
aside:
  toc: true
show_category: true
---

Python에서 예기치 않은 예외가 발생했을 때 어떻게 로깅할까요? 🕸

<!--more-->

## 🌃 배경

이것저것 개발을 하다보면 로그를 출력하여 현재 상태를 알게 됩니다. 파이썬의 경우 `logging` 이나 `rich` 를 이용해서 로깅을 하죠. 디버깅하고 싶은 내용이나 중간에 확인해놓으면 유용한 정보들을 `DEBUG` 레벨이나 `INFO` 레벨로 알게 됩니다. 또는 `try except`을 통해 예외처리를 걸어놓은 부분에선 `ERROR` 레벨로 로깅이 되죠.

그런데 예외처리를 통해서 발생하는 오류 말고 예기치 않은 곳에서 발생하는 오류는 어떻게 잡아야 할까요? 같은 조직 내에 있는 주니어 데이터 분석가, 데이터 사이언티스트 분들께 물어보면 생각보다 답이 쉽게 나오진 않았습니다. 가장 많이 나온 대답은 예상대로 이거였습니다.

```python
def main():
  ...
	
if __name__ == "__main__":
    try:
      main()
    except:
      logging.error("Error!")
```

말은 되지만 선뜻 '이거 맞네!' 라고 하긴 어려워보입니다. 우린 "예기치 않은 곳에서 발생할" 오류를 잡고 싶은건데, 이건 결국 예상한 곳에서 나오는게 아닐까요?

## 😎 해결

### 일반적인 해결법

예외가 발생하고 잡히지 않은 경우에 파이썬 인터프리터는 `sys.excepthook`을 호출하게 됩니다. 이 함수는 예외 클래스, 예외 인스턴스, 트레이스백 객체로 구성되어 있습니다. 따라서 이 함수만 로깅을 하도록 새로운 함수로 덮어 씌우면 됩니다.

```python
def catch_exception(exc_type, exc_value, exc_traceback):
    # Keyboard Interrupt를 통한 예외 발생은 무시합니다.
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    # 로깅 모듈을 이용해 로거를 미리 등록해놔야 합니다.
    logger = logging.getLogger("YOUR LOGGER")
	
    logger.error(
        "Unexpected exception.",
        exc_info=(exc_type, exc_value, exc_traceback)
	    )

# sys.excepthook을 대체합니다.
sys.excepthook = catch_exception
```

### Jupyter (IPython)에선

반면 Jupyter Notebook 환경에선 `sys.excepthook`을 덮어쓰더라도 로깅이 되지 않습니다. IPython에서는 셀을 실행할 때마다 `sys.excepthook`을 대체하기 때문인데요. 그래서 다른 방법이 필요합니다. IPython 의 설정 자체를 바꾸는 형태입니다.

```python
import sys
import traceback
import IPython

def showtraceback(self, *args, **kwargs):
    traceback_lines = traceback.format_exception(*sys.exc_info())
    del traceback_lines[1]
    message = ''.join(traceback_lines)
    sys.stderr.write(message)

IPython.core.interactiveshell.InteractiveShell.showtraceback = showtraceback
```

