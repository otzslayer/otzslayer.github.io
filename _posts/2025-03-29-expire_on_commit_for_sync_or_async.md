---
created: 2025-03-28
title: "SQLAlchemy expire_on_commit 사용법: 동기 vs 비동기 예제"
layout: post
tags: [sqlalchemy, expire_on_commit, async]
category: Python
image:
  path: https://i.imgur.com/kjKz7Qu.png
  alt: 
---

## `expire_on_commit`의 역할

SQLAlchemy에서 엔진을 생성한 다음 `sessionmaker` 또는 `async_sessionmaker`를 통해서 세션 팩토리를 생성할 때 `expire_on_commit` 인자를 사용합니다. 이 인자는 **`Session` 객체가 트랜잭션을 커밋할 때 객체의 상태를 어떻게 관리할지를 결정합니다.**

기본적으로 SQLAlchemy는 ORM 객체를 메모리에 캐싱하고, 데이터베이스의 동기화를 위해 객체를 만료(expire)시키는 매커니즘을 제공합니다. 이 인자는 `True` 또는 `False`의 값을 가지는데, 각 값이 나타내는 바는 다음과 같습니다.

- **`True`**
	- 커밋 후 세션에 연결된 모든 객체가 만료됨
	- 해당 객체를 조회할 때 데이터베이스에서 다시 쿼리를 실행해 최신 데이터를 가져옴
	- 데이터 정합성을 보장할 수 있지만 쿼리 횟수가 늘어나 성능에 영향을 줄 수 있음
- **`False`**
	- 커밋 후에도 객체가 만료되지 않고, 메모리에 남아 있는 상태를 유지함
	- 이후에 동일한 객체에 접근하면 데이터베이스 쿼리 없이 캐시된 데이터 사용
	- 성능 최적화에 좋지만 외부에서 데이터가 변경되었을 때 이를 반영하지 못할 수 있음

그러면 동기와 비동기 상황에서 이 인자는 어떻게 사용하는게 적절할까요?

## 동기 / 비동기에서 `expire_on_commit` 설정

### 동기 (Synchronous)

동기 환경에서는 일반적으로 단일 스레드에서 작업이 순차적으로 진행되며, 데이터베이스 트랜잭션도 예측 가능한 흐름을 따릅니다. 예를 들어, 웹 애플리케이션에서 사용자 요청을 처리하는 동안 세션을 생성하고 커밋하는 경우가 많습니다.

동기 환경에서는 작업이 순차적으로 진행되며, 데이터베이스 트랜잭션도 일반적인 흐름을 따릅니다. 또한 **세션을 짧게 유지하고, 필요할 때마다 새로운 쿼리를 실행하는 패턴**이 일반적입니다. 따라서 `expire_on_commit` 인자의 값으로 **`True`**를 설정하는 경우가 많습니다.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 기본 설정
engine = create_engine("sqlite:///example.db", echo=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=True)
```

### 비동기 (Asynchronous)

비동기 환경에서는 `async_sessionmaker`를 사용하며, 주로 `asyncio` 기반으로 동작합니다. 비동기 작업은 여러 코루틴이 동시에 실행될 수 있어 세션 관리가 까다롭고, **세션의 수명이 길어지는 경우가 많습니다.** 따라서 `expire_on_commit` 인자의 값을 **`False`**로 설정하는 것이 적절합니다.

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# 비동기 엔진 및 세션 설정
engine = create_async_engine("sqlite+aiosqlite:///example.db", echo=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)
```

다만 외부에서 데이터가 변경되었다면 이를 반영하기 위해 수동으로 `session.refresh()`를 호출해야 합니다.

## 정리

지금까지의 내용을 동기와 비동기 상황에 맞춰 표로 정리하자면 다음과 같습니다.


| 구분           | 동기(`sessionmaker`)          | 비동기(`async_sessionmaker`)             |
| -------------- | ----------------------------- | ---------------------------------------- |
| 권장           | `expire_on_commit=True`       | `expire_on_commit=False`                 |
| 주요 목적      | 데이터 일관성 보장            | 성능 최적화                              |
| 쿼리 발생 여부 | 커밋 후 접근 시 쿼리 발생     | 커밋 후에도 쿼리 없이 메모리 데이터 활용 |
| 적합한 상황    | 짧은 요청 주기, 멀티유저 환경 | 긴 세션 유지, 비동기 작업 다수           |



## 레퍼런스

[1] https://github.com/sqlalchemy/sqlalchemy/discussions/11495