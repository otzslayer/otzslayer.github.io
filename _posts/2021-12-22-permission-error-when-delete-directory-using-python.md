---
title: Python에서 파일 지울 때 권한 오류가 발생하는 경우
tags: [python, permission-error]
category: Python
layout: post
---

사실 터미널을 켜서 지우면 되긴 하는데... 😅

<!--more-->

## 배경

곧 포스팅하겠지만 Neural Collaborative Filtering을 구현해보고 있습니다.
재미삼아 MovieLens 100k 데이터를 다운로드하고 압축 푸는 것까지 포함하여 개발하고 있습니다.

개발 로직 중 데이터 디렉토리가 이미 존재하면 삭제하고 새로 생성한 다음 데이터를 다운로드/압축 해제하는 내용이 있습니다.
아무 생각 없이 `os.remove()`로 디렉토리를 삭제하려 했더니 다음 에러가 발생했습니다.

```
PermissionError: [Errno 1] Operation not permitted: ...
```
다른 에러였으면 그냥 넘어갔을텐데 `PermissionError`가 발생하여 의아했습니다.
실제로는 `PermissionError` 전에 다른 에러가 먼저 발생해야 했습니다.
우선 파일이 아닌 디렉토리를 삭제할 때는 `os.rmdir()`을 사용해야 했죠.
그래서 권한과 관련된 에러보단 다른 에러가 발생해야 했습니다.
문제는 `os.rmdir()`을 이용해 디렉토리를 삭제 시도를 해도 디렉토리가 비어 있지 않을 때는 아래의 에러가 먼저 발생해야 합니다.

```
OSError: [Errno 66] Directory not empty
```

## 해결

원인을 파악하지는 못했지만 `shutil.rmtree()`를 이용해서 어떤 경우에도 디렉토리를 삭제하는 것으로 해결했습니다.
참고로 해당 디렉토리를 사용하고 있는 경우엔 에러가 발생할 수 있습니다.
또한 `os.rmdir()`과 달리 많은 예외처리 로직이 내부에 있어서 속도가 느릴 수 있다는 [이야기](https://stackoverflow.com/questions/5470939/why-is-shutil-rmtree-so-slow)도 있습니다.