---
title: SQLAlchemy에서 비밀번호에 '@'이 들어가서 연결에 실패할 때
tags: [sqlalchemy, encoding]
category: Python
layout: post
---


<!--more-->

## 문제 발생

SQLAlchemy를 이용해 데이터베이스에 연결을 하려고 할 때 보통 다음과 같이 엔진을 생성합니다.

```python
from sqlalchemy import create_engine

engine = create_engine(f"mysql://{user}:{password}@{host}:{port}/{database}")
```

그런데 비밀번호에 `@`와 같은 일부 특수문자가 들어가면 실제로 DB에 연결을 할 때 주소를 찾을 수 없다는 에러가 발생합니다. 

## 문제 해결

비밀번호에 `@`를 추가해서 예를 한 번 들어보겠습니다.

```python
user = "user"
password = "pw1234!@#$"
host = "host"
database = "database"
port = 3306

engine = create_engine(f"mysql://{user}:{password}@{host}:{port}/{database}")

engine
# mysql://user:***@#$@host:3306/database

print(engine.url)
# mysql://user:pw1234!@#$@host:3306/database
```

엔진의 URL을 출력했을 때 원래대로라면 비밀번호는 `*`로 마스킹되어야 하지만 `@`부터 마스킹되지 않은 채 그대로 출력되는 것을 확인할 수 있습니다. 즉 `@`가 일종의 탈출 문자처럼 호스트 주소를 나타내는 것처럼 쓰이는 것이죠.

SQLAlchemy의 경우 엔진을 생성할 때 실제 URL을 보내는 것과 동일하기 때문에 특수 문자가 들어갔을 때 URL 인코딩을 해줘야 합니다. `sqlalchemy.engine.URL.create()`를 이용해 URL을 생성하면 이런 부분을 알아서 해결해줍니다.

```python
import sqlalchemy

url = sqlalchemy.engine.URL.create(
	drivername="mysql",
    username=user,
    password=password,
    host=host,
    port=port,
    database=database,
)

url
# mysql://user:***@host:3306/database

print(url)
# mysql://user:pw1234!%40#$@host:3306/database
```

이렇게 하면 URL이 정상적으로 생성되어 실제 DB 연결에도 문제가 발생하지 않습니다.

이외에도 특수 문자가 들어가는 경우에 URL 인코딩을 별도로 해줘서 문제를 해결할 수도 있습니다.

```python
from urllib import quote_plus

password = quote_plus(password)
engine = create_engine(f"mysql://{user}:{password}@{host}:{port}/{database}")

engine
# mysql://user:***@host:3306/database

print(engine.url)
# mysql://user:pw1234!%40#$@host:3306/database
```
