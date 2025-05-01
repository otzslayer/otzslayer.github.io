---
created: 2025-05-01
title: FastAPI @on_event에서 @asynccontextmanager로 갈아타기
layout: post
tags: [fastapi, lifespan, asyncio, asynccontextmanager, application-state, startup-events]
category: FastAPI
image:
  path: https://i.imgur.com/I4nSNZD.jpeg
  alt: Image from [Unsplash](https://unsplash.com/ko/%EC%82%AC%EC%A7%84/%EC%82%AC%EB%A7%89%EC%97%90%EC%84%9C-%EB%B0%98%EB%8C%80-%EB%B0%A9%ED%96%A5%EC%9D%84-%EA%B0%80%EB%A6%AC%ED%82%A4%EB%8A%94-%EB%8F%84%EB%A1%9C-%ED%91%9C%EC%A7%80%ED%8C%90-h1OhvEIIcxs)
---

FastAPI를 사용하다보면 애플리케이션 서비스 시작과 종료 시점에 특정 작업을 처리하기 위해서 `@app.on_event("startup")`과 `@app.on_event("shutdown")` 데코레이터를 사용합니다. 미리 설정 파일을 불러오거나, 쿼리를 통해 전역 변수로 특정 값을 설정하는 작업에 매우 유용합니다. 하지만 FastAPI 최신 버전에서는 이 방식보다는 `lifespan`  파라미터와 표준 라이브러리인 `contextlib`의 `asynccontextmanager`를 사용하도록 권장하고 있습니다. [지난 포스트](https://otzslayer.github.io/fastapi/2025/04/25/app-state-in-fastapi.html)에서는 `@app.on_event()`로 코드를 작성했지만 이번 포스트에서는 기존 포스트의 코드를 모두 `asynccontextmanager`로 바꾸고, 서비스 시작 시 여러 작업을 처리해야 할 때 어떻게 `lifespan`방식으로 개발할 수 있는지 알아봅니다.

## 기존 방식: `@app.on_event`

지난 포스트에서는 아래와 같이 `@app.on_event()` 데코레이터를 이용했습니다.

```python
# main.py
from fastapi import FastAPI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

@app.on_event("startup")
async def load_configs():
    async with AsyncSession(engine) as session:
        rows = await session.execute(select(settings.c.config_value))
        app.state.config_values = rows.scalars().all()
```

여기서 Redis를 시작/종료하는 이벤트까지 추가하면 아래와 같이 됩니다.

```python
# main.py
# 임포트 생략

app = FastAPI()

@app.on_event("startup")
async def load_configs():
    async with AsyncSession(engine) as session:
        rows = await session.execute(select(settings.c.config_value))
        app.state.config_values = rows.scalars().all()

@app.on_event("startup")
async def start_redis():
    try:
        await redis.startup()
        await redis.redis.ping()
    except Exception as e:
        pass

@app.on_event("shutdown")
async def shutdown_redis():
    await redis.shutdown()
```

사실 추후에 지원 종료된다고 하지만 나름 간단하고 직관적인 방법입니다. 공식 문서에서도 이 방식을 지원 종료하려는지 자세하게 나온 내용은 없었습니다. 이제 이 로직을 `asynccontextmanager`로 바꿔보도록 하겠습니다.

## 새로운 방식: `@asynccontextmanager`와 `lifespan`

`@asynccontextmanager` 데코레이터는 비동기 컨텍스트 매니저를 생성합니다. [[출처]](https://docs.python.org/3/library/contextlib.html#contextlib.asynccontextmanager) 이 데코레이터는 반드시 제네레이터에 적용해야 하므로 적용될 함수는 `yield`를 포함해야 합니다. 그리고 `yield` 기준으로 코드를 두 부분으로 나누게 됩니다.

- `yield` 이전: 컨텍스트 매니저에 진입할 때 실행될 코드
	- 기존 `startup` 로직입니다.
- `yield` 이후: 컨텍스트 매니저를 빠저나갈 때 실행될 코드
	- 기존 `shutdown` 로직입니다.
	- 보통 `try ... finally` 구문으로 사용합니다.

간단하게 Redis를 시작/종료 하는 이벤트를 `@asynccontextmanager` 데코레이터를 이용해서 변경해보겠습니다.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def redis_lifespan(app: FastAPI):
    try:
        await redis.startup()
        await redis.redis.ping()
        app.state.redis = "Run"
    except: Exception as e:
        app.state.redis = None

    try:
        yield
    finally:
        await redis.shutdown()
```

단순히 데코레이터를 바꾸고 `startup` 로직과 `shutdown` 로직을 하나의 비동기 함수 안에 넣되 `yield`를 기준으로 나눠주었습니다. `try ... finally` 구조이므로 종료 로직이 최대한 실행되도록 보장할 수 있습니다. 이렇게 만든 `redis_lifespan()` 함수를 FastAPI 앱 선언 시 `lifespan` 파라미터로 넘겨주면 됩니다.

```python
app = FastAPI(lifespan=redis_lifespan)
```

이전과 다른 점은 앱을 선언한 다음 `startup`과 `shutdown` 로직을 선언했다면, 지금은 함수를 작성한 다음 그 함수를 앱에 직접 넣어줍니다.

### 여러 개의 함수는?

하지만 FastAPI의 `lifespan` 인자는 하나의 함수만 받을 수 있습니다. 따라서 지금 위에서 열거한 여러 개의 로직을 한꺼번에 넣을 수 없습니다. 여러 개의 `lifespan`을 사용하려면 여러 방법이 있습니다. 가장 간단한 방법은 하나의 함수에 모든 로직을 다 넣는 것이지만 각각이 해야 할 일이 분리되지 않는 문제가 있습니다. 또한 `async with`를 중첩하여 함수를 작성하는 방법도 있습니다.

```python
@asynccontextmanager
async def nested_lifespan(app: FastAPI):
    async with first_lifespan(app):
        async with second_lifespan(app):
            yield
```

역시 간단하지만 컨텍스트 매니저가 많아진다면 코드가 깊어지는 문제가 생깁니다. 따라서 이 포스트에서는 `AsyncExitStack()`을 활용하는 방법을 사용합니다. [[참고]](https://github.com/fastapi/fastapi/pull/9657/files) 우선 두 개의 함수를 아래와 같이 작성합니다.

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def load_configs(app: FastAPI):
    async with AsyncSession(engine) as session:
        rows = await session.execute(select(settings.c.config_value))
        app.state.config_values = rows.scalars().all()
	yield

@asynccontextmanager
async def redis_lifespan(app: FastAPI):
    try:
        await redis.startup()
        await redis.redis.ping()
        app.state.redis = "Run"
    except: Exception as e:
        app.state.redis = None

    try:
        yield
    finally:
        await redis.shutdown()
```

그 다음 메인 `lifespan` 함수를 아래와 같이 작성합니다. 그리고 앱에 해당 메인 `lifespan` 함수를 연결해주면 됩니다.

```python
@asynccontextmanager
async def main_lifespan(app: FastAPI):
    async with AsyncExitStack() as stack:
        await stack.enter_async_context(load_config(app))
        await stack.enter_async_context(redis_lifespan(app))
        yield

app = FastAPI(lifespan=main_lifespan)
```

## 나가며

기존 `@app.on_event` 방식도 여전히 동작하지만, FastAPI에서 권장하는 `lifespan`과 `@asynccontextmanager`를 사용하면 좀 더 깔끔하고 파이썬스러운 방식으로 애플리케이션의 시작과 종료 로직을 관리할 수 있습니다. 특히 새로 프로젝트를 시작하거나 기존 코드를 리팩토링할 기회가 있다면 이 방식을 고려해보는 것을 추천합니다.