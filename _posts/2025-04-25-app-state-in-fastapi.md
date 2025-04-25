---
created: 2025-04-25
title: FastAPI에서 app.state 활용하기
layout: post
tags: [fastapi, starlette, application-state, startup-events]
category: FastAPI
image:
  path: https://i.imgur.com/5e25iz6.png
  alt: Image from [Unsplash](https://unsplash.com/ko/%EC%82%AC%EC%A7%84/macbook-pro-%EC%BC%9C%EA%B8%B0-LKsHwgzyk7c)
---

FastAPI로 서비스를 구축하다 보면 애플리케이션 기동 시 한 번 불러온 결과를 전역 변수처럼 재사용하고 싶을 때가 많습니다. 이때 일반적인 전역 변수보다 안전하고, FastAPI의 의존성 주입과도 잘 어울리는 방법이 바로 `app.state`입니다. 이 포스트에서는 `app.state`의 개념과 구현 패턴, 그리고 예시를 정리합니다.

## `app.state`란 무엇인가

`FastAPI` 는  `Starlette` 의 서브클래스로 구현되어 있습니다. [[출처]](https://unsplash.com/ko/%EC%82%AC%EC%A7%84/macbook-pro-%EC%BC%9C%EA%B8%B0-LKsHwgzyk7c) 따라서 Starlette가 제공하는 `app.state`(임의의 속성을 자유롭게 저장, 공유할 수 있는 네임스페이스)를 그대로 이용할 수 있습니다. 

- **저장 위치**: `FastAPI` 인스턴스 자체
- **생애 주기**: 프로세스가 살아 있는 동안 유지
- **주요 용도**: 설정 값, 싱글톤 서비스 객체, 캐시 등
    

## 스타트업 이벤트에서 값 로드하기

`app.state`에 값을 넣는 가장 일반적인 시점은 애플리케이션 기동 직전입니다. FastAPI는 `startup` 이벤트를 제공하며, 이 이벤트에서 비동기/동기 코드 모두 실행할 수 있습니다. `startup` 이벤트는 간편하게 데코레이터를 이용하여 생성합니다.

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

기동 시점에만 한 번 호출되므로 DB 부하를 최소화하면서 전역 설정을 안전하게 확보할 수 있습니다.

## 구현 패턴

### 패턴 1: 엔드포인트에서 직접 주입

가장 직관적인 방식은 엔드포인트 내부에서 `request.app.state` 값을 꺼내 로직 클래스에 전달하는 것입니다.

```python
# routers/hello.py
from fastapi import APIRouter, Request
from services.greeter import Greeter

router = APIRouter()

@router.get("/hello")
async def hello(name: str, request: Request):
    greeter = Greeter(request.app.state.config_values)
    return {"msg": greeter.greet(name)}
```

- **장점**: 구현이 단순
- **단점**: 테스트 시 `request` 객체를 직접 만들어야 하므로 약간 번거로움
    

### 패턴 2: Depends로 서비스 인스턴스 주입

의존성 주입을 활용하면 라우터 코드가 더 깔끔해집니다. 

```python
# deps.py
from fastapi import Request, Depends
from services.greeter import Greeter

def get_greeter(request: Request) -> Greeter:
    return Greeter(request.app.state.config_values)
```

```python
# routers/hello.py
from fastapi import APIRouter, Depends
from deps import get_greeter
from services.greeter import Greeter

router = APIRouter()

@router.get("/hello")
async def hello(name: str, greeter: Greeter = Depends(get_greeter)):
    return {"msg": greeter.greet(name)}
```

테스트에서는 `get_greeter`를 손쉽게 모킹해 다른 설정을 주입할 수 있습니다.

### 패턴 3: 싱글톤 서비스 자체를 `app.state`에 저장

설정 값이 아니라 서비스 인스턴스를 통째로 저장해도 됩니다.

```python
# main.py (계속)
from services.greeter import Greeter

@app.on_event("startup")
async def init_services():
    app.state.greeter = Greeter(app.state.config_values)
```

```python
# routers/hello.py
from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/hello")
async def hello(name: str, request: Request):
    return {"msg": request.app.state.greeter.greet(name)}
```

- **장점**: 애플리케이션 전역에서 동일 인스턴스 재사용    
- **단점**: 싱글톤이므로 동시성에 주의(내부에서 mutable 상태를 변경하면 안 됨)
    
## 더 알아볼 내용

### 여러 스타트업 핸들러를 둘 때의 순서

`@app.on_event("startup")`는 여러 번 선언해도 문제없습니다. FastAPI는 핸들러가 등록된 순서대로 실행합니다. 모듈 임포트 순서가 곧 실행 순서이므로 의존 관계가 있다면 파일 구조와 import 순서를 신경 써야 합니다.

## 마무리

`app.state`는 전역 변수보다 안전하고, 의존성 주입과 유연하게 결합하는 편리한 공유 저장소입니다. 스타트업 이벤트와 함께 사용하면 데이터베이스나 파일 시스템에서 값을 한 번만 읽어 들인 뒤, 애플리케이션 전역에서 손쉽게 활용할 수 있습니다. 