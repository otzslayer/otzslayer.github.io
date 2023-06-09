---
title: 'Parquet에서 Unhandled type for Arrow to Parquet schema conversion - halffloat 이 발생할 때'
tags: [parquet, halffloat]
category: Pandas
layout: post
---

🤬 Unhandled type for Arrow to Parquet schema conversion: halffloat

<!--more-->


## 🖼 배경

최근 데이터를 저장하고 불러올 때, 빠른 I/O 속도와 컬럼의 데이터 타입을 메타 데이터로 저장할 수 있어서 Parquet 타입을 자주 사용하고 있습니다. Dependency로 `pyarrow`나 `fastparquet`만 설치하면 `pandas`에서 `pd.DataFrame.to_parquet()`로 바로 사용할 수 있습니다. 그런데 데이터를 저장하는데 아래와 같은 오류가 발생하는 경우가 있었습니다.

```python
df.to_parquet(DATA_PATH)
>> Unhandled type for Arrow to Parquet schema conversion: halffloat
```

## 🤔 해결

`halffloat`이란 `float16` 타입을 의미합니다. 데이터에 `float16` 타입의 컬럼이 있으면 Apache Arrow가 해당 데이터 타입을 지원을 하지 않기 때문에 오류가 발생하게 됩니다. 해결 방법은 두 가지입니다.
- 데이터 타입을 `float32`로 바꾸거나
- `to_parquet` 메서드에 `engine="fastparquet"` 인자를 추가하면 됩니다.
(일반적으로 Parquet 형태로 저장할 때는 `pyarrow` 엔진을 기본값으로 사용합니다.)