---
title: Python에서 MySQL 쿼리 결과에 컬럼 자동으로 붙이기
tags: [pymysql, sqlalchemy, mysql]
category: Python
layout: post
---


<!--more-->

## 들어가며

Python에서 MySQL 데이터베이스에 연결할 때 일반적으로 `pymysql`이나 `SQLAlchemy`를 많이 사용합니다. 편의성과 기능성을 따져보면 `SQLAlchemy`가 압도적이긴 하지만, 여전히 `pymysql`도 많이 사용하곤 합니다. 이번에 진행 중인 프로젝트에서도 두 라이브러리를 많이 사용하고 있는데, 데이터베이스 내의 테이블을 쿼리로 조회하는 레거시 코드는 `pymysql`로 되어 있었습니다. 생각 없이 코드를 읽다 보니 데이터를 가져온 다음 컬럼을 손수 지정하는 부분이 있었습니다. 분명 컬럼을 알아서 붙여주는 방법이 있을 것 같아 간단하게나마 블로그에 정리하고자 합니다.

## 알아보기

### 바닐라 코드

`pymysql`을 이용해 테이블을 가져오는 가장 일반적인 코드는 이렇습니다.

```python
import pymysql

connection = pymysql.connect(
    host=host, 
    user=user, 
    password=password, 
    db=db, 
    charset="utf8"
)
cursor = connection.cursor()
query = "SELECT * FROM TABLE_NAME"
cursor.execute(query)
result = cursor.fetchall()
connection.close()
```

`pymysql.connect()`로 데이터베이스 연결을 정의하고 `cursor`를 이용해 데이터를 가져오는 형태입니다. 이렇게 가져온 데이터는 튜플에 저장되기 때문에 컬럼명을 갖고 있지 않습니다. 쿼리가 복잡하지 않다면 하나하나 지정하기 까다롭지 않겠지만 보통은 적당히 긴 쿼리를 이용할 테니 귀찮은 일이 생긴 셈이죠.

### `DictCursor` 사용하기

위 코드 스니펫에서 딱 하나만 추가하면 데이터를 튜플이 아닌 **딕셔너리**로 저장할 수 있습니다. 바로 `pymysql.cursors.DictCursor`를 사용하는 건데요. 위 코드 스니펫에서 10번 줄을 다음과 같이 수정해줍니다.

```python
import pymysql

connection = pymysql.connect(
    host=host, 
    user=user, 
    password=password, 
    db=db, 
    charset="utf8"
)
cursor = connection.cursor(pymysql.cursors.DictCursor)
query = "SELECT * FROM TABLE_NAME"
cursor.execute(query)
result = cursor.fetchall()
connection.close()
```

이제 결과를 확인해보면 컬럼명에 값이 할당된 딕셔너리 형태로 저장된 것을 볼 수 있습니다. 이렇게 저장하면 별도의 List comprehension 없이 바로 데이터 프레임으로 변환할 수 있습니다.

```python
import pandas as pd

df = pd.DataFrame(result)
df.head()
```

## 나가며

간단한 내용이었지만 사실 처음부터 `SQLAlchemy`와 `pandas`를 이용하면 더 간단하게 테이블을 그대로 가져올 수 있습니다. `pandas.read_sql()` 를 사용하면 되는데요. 이미 잘 돌아가고 있던 코드를 굳이 수정하기 귀찮아서 방치하고 있습니다. 바쁜 일들이 끝나고 코드를 개선할 시간이 생길 때 `pymysql` 부분을 다 `SQLAlchemy`로 수정해봐야겠습니다.



## 레퍼런스

-   [http://www.kitebird.com/articles/pydbapi.html](http://www.kitebird.com/articles/pydbapi.html)
-   [https://pandas.pydata.org/docs/reference/api/pandas.read_sql.html](https://pandas.pydata.org/docs/reference/api/pandas.read_sql.html)