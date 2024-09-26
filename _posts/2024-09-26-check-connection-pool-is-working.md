---
created: 2024-09-25
title: SQLAlchemy 커넥션 풀 작동 확인하기
layout: post
tags: [sqlalchemy, connection-pool, queue-pool]
category: Python
image:
  path: https://i.imgur.com/s6FtV55.png
  alt: 
---

## 커넥션 풀

**커넥션 풀(Connection Pool)**이란 향후 데이터베이스에 대한 요청이 필요할 때 커넥션을 재사용할 수 있도록 유지 관리하는 데이터베이스 커넥션에 대한 일종의 캐시입니다. 특히 서버 측 웹 애플리케이션의 경우, 커넥션 풀은 요청 간에 재사용되는 활성 데이터베이스 커넥션 '풀'을 메모리에 유지하는 표준적인 방법입니다. [[출처]](https://docs.sqlalchemy.org/en/20/core/pooling.html)

Python에서 널리 사용하는 ORM인 SQLAlchemy는 `Engine` 생성 시 사용할 수 있는 여러 커넥션 풀 구현체가 있습니다. 본 포스트에서는 SQLAlchemy에서 커넥션 풀을 사용하는 간단한 방법과 올바르게 작동하고 있는지 확인하는 방법에 대해서 다룹니다.

## 커넥션 풀 설정

SQLAlchemy에서 `create_engine()` 함수로 `Engine`을 생성할 때 기본값으로 커넥션 풀을 설정하게 됩니다. 이때 `QueuePool` 이라는 커넥션 풀 구현체를 사용하게 됩니다. 엔진 생성 시 `QueuePool`에 사용하는 튜닝 파라미터는 크게 네 가지 입니다. 다른 파라미터에 대해서는 [공식 문서](https://docs.sqlalchemy.org/en/20/core/engines.html#sqlalchemy.create_engine)를 참고하시기 바랍니다.

- `pool_size` : 커넥션 풀의 크기 (기본값 5)
- `max_overflow` : 최대 초과 커넥션 수 (기본값 10)
- `pool_recycle` : 여기에서 지정한 시간이 지나면 커넥션을 재활용하여 새로 고침 (기본값 -1, 사용 안함)
- `pool_timeout` :  풀에서 커넥션을 가져오기 위해 대기하는 최대 시간 (기본값 30초)

위 파라미터를 이용해서 다음과 같이 엔진을 생성하면 기본적으로 커넥션 풀 설정이 완료됩니다. 아래 코드는 PostgreSQL 기준입니다.

```python
from sqlalchemy import create_engine

url = "postgresql+psycopg2://me@localhost/mydb"
engine = create_engine(
    url, pool_size=5, max_overflow=10, pool_timeout=30
)
```

## 커넥션 풀 실험

### 커넥션 풀이 잘 작동하는지 확인하기

커넥션 풀을 올바르게 생성했다면 DB 연결 시 새로운 커넥션을 생성하지 않고 반환 받은 커넥션을 재사용하는 모습을 보일겁니다. 이런 모습을 관찰하기 위해 아래와 같이 SQLAlchemy의 Pool 기능이 어떻게 작동하는지 로그를 남기겠습니다.

```python
import logging

# 커넥션 풀 관련 로그
formatter = logging.Formatter(
    "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

handler = logging.FileHandler(filename="sqlalchemy.log")
handler.setFormatter(formatter)

logger = logging.getLogger("sqlalchemy.pool")
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)
```

이렇게 설정하면 SQLAlchemy의 Pool 관련 기능이 어떻게 작동하는지 `DEBUG` 레벨까지 `./sqlalchemy.log`에 상세히 기록됩니다.

그리고 다음 코드를 실행하여 간단한 쿼리를 10회 수행하고, 각 수행마다 커넥션을 맺고 다시 반환하도록 하겠습니다.

```python
import time

import numpy as np
import sqlalchemy
from sqlalchemy import event, text

global times
times = []

# 커넥션이 체크아웃될 때(풀에서 사용될 때) 호출되는 이벤트 리스너
@event.listens_for(engine, "checkout")
def connection_checkout(dbapi_connection, connection_record, connection_proxy):
    print(f"Connection Check-out: {id(dbapi_connection)}")

# 커넥션이 체크인될 때(풀로 반환될 때) 호출되는 이벤트 리스너
@event.listens_for(engine, "checkin")
def connection_checkin(dbapi_connection, connection_record):
    print(f"Connection Check-in: {id(dbapi_connection)}")

# 쿼리를 수행하는 함수
def perform_queries():
    start_time = time.time()
    with engine.connect() as conn:
        result = conn.execute(
            text(
                "SELECT * FROM YOUR_TABLE LIMIT 10"
            )
        )
    end_time = time.time()
    taken_time = end_time - start_time
    times.append(taken_time)
    logger.info(f"Time taken: {taken_time:.4f} seconds.")

# 커넥션 풀 테스트
if __name__ == "__main__":
    for _ in range(10):
        perform_queries()
    logger.info(f"Average time taken: {np.mean(times):.4f} seconds.")
    logger.info("Job done.\n")
```

### 이벤트 리스너

위 코드에서 두 개의 콜백 함수를 사용하는데요. 두 함수는 비슷한 기능을 하기 때문에 첫 번째 콜백 함수에 대해서 자세히 알아보도록 하겠습니다.

```python
# 커넥션이 체크아웃될 때(풀에서 사용될 때) 호출되는 이벤트 리스너
@event.listens_for(engine, "checkout")
def connection_checkout(dbapi_connection, connection_record, connection_proxy):
    print(f"Connection Check-out: {id(dbapi_connection)}")
```

위 함수는 `@event.listens_for()` 데코레이터로 감싸져 있습니다. 이 데코레이터는 SQLAlchemy 이벤트 리스너를 설정하는 데코레이터로, 위 코드에서는 커넥션 체크아웃 시 이벤트 핸들러 함수인 `connection_checkout()` 이 호출되도록 합니다. 해당 함수가 호출되면 현재 커넥션의 고유 ID를 출력합니다.

유사하게 `connection_checkin()` 함수는 커넥션 체크인 시 해당 커넥션의 고유 ID를 출력합니다.

### 결과 확인

위 코드를 실행하면 다음과 같은 결과가 나옵니다.

```
Connection Check-out: 140117875357552
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552 
Connection Check-out: 140117875357552 
Connection Check-in: 140117875357552
```

체크인되는 커넥션과 체크아웃되는 커넥션의 ID가 모두 같은 것을 확인할 수 있습니다. 

> 참고로 커넥션의 ID는 커넥션 풀을 끄더라도 모두 같은 경우가 있습니다. `id(dbapi_connection)` 자체가 객체의 메모리 주소를 반환하기 때문입니다. 하지만 커넥션 풀을 사용하면 모두 같은 ID로, 커넥션 풀을 끄면 높은 확률로 다른 ID를 반환합니다.
{:.prompt-info}

로그를 확인해보면 더 자세히 알 수 있습니다.

```
2024-09-26 17:45:26,873 - sqlalchemy.pool.impl.QueuePool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f6fbc2ff770>
2024-09-26 17:45:26,946 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:26,962 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:26,963 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:26,963 - sqlalchemy.pool - INFO - Time taken: 0.1174 seconds.
2024-09-26 17:45:26,963 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:26,972 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:26,972 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:26,972 - sqlalchemy.pool - INFO - Time taken: 0.0085 seconds.
2024-09-26 17:45:26,972 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:26,980 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:26,980 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:26,980 - sqlalchemy.pool - INFO - Time taken: 0.0079 seconds.
2024-09-26 17:45:26,980 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:26,987 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:26,987 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:26,987 - sqlalchemy.pool - INFO - Time taken: 0.0071 seconds.
2024-09-26 17:45:26,987 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:26,994 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:26,994 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:26,994 - sqlalchemy.pool - INFO - Time taken: 0.0067 seconds.
2024-09-26 17:45:26,994 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:27,000 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:27,001 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:27,001 - sqlalchemy.pool - INFO - Time taken: 0.0064 seconds.
2024-09-26 17:45:27,001 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:27,008 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:27,008 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:27,008 - sqlalchemy.pool - INFO - Time taken: 0.0074 seconds.
2024-09-26 17:45:27,008 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:27,017 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:27,017 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:27,017 - sqlalchemy.pool - INFO - Time taken: 0.0086 seconds.
2024-09-26 17:45:27,017 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:27,025 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:27,026 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:27,026 - sqlalchemy.pool - INFO - Time taken: 0.0086 seconds.
2024-09-26 17:45:27,026 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> checked out from pool
2024-09-26 17:45:27,034 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> being returned to pool
2024-09-26 17:45:27,034 - sqlalchemy.pool.impl.QueuePool - DEBUG - Connection <pyodbc.Connection object at 0x7f6fbc2ff770> reset, transaction already reset
2024-09-26 17:45:27,034 - sqlalchemy.pool - INFO - Time taken: 0.0082 seconds.
2024-09-26 17:45:27,034 - sqlalchemy.pool - INFO - Average time taken: 0.0187 seconds.
2024-09-26 17:45:27,034 - sqlalchemy.pool - INFO - Job done.
```

QueuePool이 올바르게 사용되고 있고, 최초의 커넥션을 제외한 모든 커넥션은 다음 순서대로 작동하고 있습니다.

```
- checked out from pool
- being returned to pool
- reset, transaction already reset
```

위 내용을 살펴보면 커넥션을 풀에서 꺼내서 사용한 후 다시 풀로 반환하는 것을 알 수 있습니다. 열 번의 수행의 평균 소요 시간은 0.0187초였습니다. 최초 커넥션만 0.1초 이상 걸렸고 그 이후는 약 0.01초 미만으로 걸린 것을 확인할 수 있습니다.

### 비교 실험

과연 커넥션 풀을 사용하지 않은, 다시 말해서 모든 커넥션을 맺고 끊는 방법과 비교하였을 때 어느 정도의 성능 향상이 있을까요? 커넥션 풀을 사용하지 않기 위해서는 아래 코드와 같이 엔진 생성 시 `QueuePool` 대신 `NullPool` 을 사용해야 합니다.

```python
from sqlalchemy.pool import NullPool

url = "postgresql+psycopg2://me@localhost/mydb"
engine = create_engine(url, poolclass=NullPool)
```

이후 코드는 동일합니다. 결과를 살펴보면 아까와 사뭇 다릅니다.

```
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429341776 
Connection Check-in: 139703429341776 
Connection Check-out: 139703429343024 <-
Connection Check-in: 139703429343024 
Connection Check-out: 139703429343024 
Connection Check-in: 139703429343024
Connection Check-out: 139703429343024 
Connection Check-in: 139703429343024 
Connection Check-out: 139703429343440 <-
Connection Check-in: 139703429343440
```

고유 ID가 중간에 변경되는 것을 확인할 수 있습니다. 로그에는 더 명확하게 차이점을 볼 수 있습니다.

```
2024-09-26 19:49:00,657 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,704 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,717 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,718 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,718 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,718 - sqlalchemy.pool - INFO - Time taken: 0.0852 seconds.
2024-09-26 19:49:00,729 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,730 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,741 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,741 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,742 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,742 - sqlalchemy.pool - INFO - Time taken: 0.0238 seconds.
2024-09-26 19:49:00,753 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,753 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,764 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,764 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,764 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,765 - sqlalchemy.pool - INFO - Time taken: 0.0223 seconds.
2024-09-26 19:49:00,775 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,775 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,786 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,786 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,786 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,787 - sqlalchemy.pool - INFO - Time taken: 0.0221 seconds.
2024-09-26 19:49:00,798 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,798 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,809 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,809 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,809 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,810 - sqlalchemy.pool - INFO - Time taken: 0.0226 seconds.
2024-09-26 19:49:00,820 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,820 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> checked out from pool
2024-09-26 19:49:00,831 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> being returned to pool
2024-09-26 19:49:00,831 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a250> reset, transaction already reset
2024-09-26 19:49:00,831 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a250>
2024-09-26 19:49:00,832 - sqlalchemy.pool - INFO - Time taken: 0.0222 seconds.
2024-09-26 19:49:00,842 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,842 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> checked out from pool
2024-09-26 19:49:00,854 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> being returned to pool
2024-09-26 19:49:00,854 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> reset, transaction already reset
2024-09-26 19:49:00,854 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,855 - sqlalchemy.pool - INFO - Time taken: 0.0227 seconds.
2024-09-26 19:49:00,866 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,866 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> checked out from pool
2024-09-26 19:49:00,877 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> being returned to pool
2024-09-26 19:49:00,877 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> reset, transaction already reset
2024-09-26 19:49:00,877 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,878 - sqlalchemy.pool - INFO - Time taken: 0.0228 seconds.
2024-09-26 19:49:00,888 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,888 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> checked out from pool
2024-09-26 19:49:00,899 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> being returned to pool
2024-09-26 19:49:00,900 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a730> reset, transaction already reset
2024-09-26 19:49:00,900 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a730>
2024-09-26 19:49:00,900 - sqlalchemy.pool - INFO - Time taken: 0.0226 seconds.
2024-09-26 19:49:00,911 - sqlalchemy.pool.impl.NullPool - DEBUG - Created new connection <pyodbc.Connection object at 0x7f0f3d47a8d0>
2024-09-26 19:49:00,911 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a8d0> checked out from pool
2024-09-26 19:49:00,923 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a8d0> being returned to pool
2024-09-26 19:49:00,923 - sqlalchemy.pool.impl.NullPool - DEBUG - Connection <pyodbc.Connection object at 0x7f0f3d47a8d0> reset, transaction already reset
2024-09-26 19:49:00,923 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a8d0>
2024-09-26 19:49:00,923 - sqlalchemy.pool - INFO - Time taken: 0.0229 seconds.
2024-09-26 19:49:00,924 - sqlalchemy.pool - INFO - Average time taken: 0.0289 seconds.
2024-09-26 19:49:00,924 - sqlalchemy.pool - INFO - Job done.
```

아까 로그와 비슷해보이지만 커넥션을 닫는 것을 확인할 수 있습니다.
```
2024-09-26 19:49:00,923 - sqlalchemy.pool.impl.NullPool - DEBUG - Closing connection <pyodbc.Connection object at 0x7f0f3d47a8d0>
```

평균 수행시간도 0.0289초로 커넥션 풀을 사용하였을 때보다 1.5배에서 2배 더 걸렸습니다. 사실 최초 커넥션을 제외하면 평균적으로 세 배 가까이 더 걸린 것을 확인할 수 있습니다.
