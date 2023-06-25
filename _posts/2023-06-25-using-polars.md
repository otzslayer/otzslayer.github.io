---
title: Polars 사용기
layout: post
tags: [polars, pandas]
category: Polars
image:
  path: https://i.imgur.com/1h26Chi.png
  alt: Image from [here](https://towardsdatascience.com/pandas-vs-polars-a-syntax-and-speed-comparison-5aa54e27497e)
---

## 들어가며


![](https://i.imgur.com/gr10ZvX.png){: w="600"}
_Image from [here](https://github.com/pola-rs/polars)_


데이터 분석하는 분들에게 데이터 프레임을 어떤 도구로 처리하냐고 물어보면 100이면 100, Pandas를 이용한다고 하실겁니다. 그런데 Pandas는 태생적인 문제가 있죠. 바로 **속도**입니다. 이 속도를 높여보기 위해서 우리는 별의별 방법을 사용해왔죠. 멀티프로세싱도 당연히 해봤고, 데이터 조인 속도를 높이기 위해 인덱싱도 해봤습니다. 이제는 그런 짓을 조금 내려놓고 싶은 와중에 바로 [**Polars**](https://github.com/pola-rs/polars)를 접하게 되었습니다. 본 포스트에서는 Polars를 사용해보고 난 감상을 짧게 적어볼까 합니다.

## Polars의 특징

Polars는 Apache Arrow 컬럼 형식을 메모리 모델로 사용하여 Rust로 구현한 OLAP 쿼리 엔진 위에서 작동하는 데이터프레임 인터페이스입니다. 기본적으로 Apache Arrow와 Rust 기반이기 때문에 속도 측면에서는 Pandas보다 압도적일 수 밖에 없습니다. 

> 물론 최근 Pandas 2.0.0 배포 후 Pandas도 백엔드로 Apache Arrow를 사용할 수 있지만 속도는 여전히 Polars에 미치지 못합니다.
{:.prompt-info}

Polars 공식 저장소에서 말하는 [Polars의 특장점](https://pola-rs.github.io/polars-book/)은 다음과 같습니다.

- 속도
	- Polars는 외부 종속성 없이 머신에 가깝게 설계되어 빠른 속도를 갖고 있습니다.
- I/O
	- 로컬, 클라우드 스토리지, 데이터베이스 등 모든 일반적인 데이터 스토리지 계층을 지원합니다.
- 사용성
	- 함수형 프로그래밍처럼 의도한 대로 쿼리를 작성하면 됩니다.
	- Polars는 내부에서 쿼리 최적화 도구를 사용해 가장 효율적인 실행 방법을 결정합니다.
- Out-of-core
	-  스트리밍 API를 통해 메모리보다 큰 데이터를 처리할 수 있습니다.
	- 모든 데이터를 동시에 메모리에 저장하지 않고 결과를 처리할 수 있기 때문입니다.
- 병렬 처리
	- 추가적인 처리 없이 사용 가능한 CPU 코어에 작업을 분할하여 병렬 처리할 수 있습니다.
- 벡터화된 쿼리 엔진
	- Polars는 기본적으로 컬럼 형식의 데이터 형식인 Apache Arrow를 사용해 쿼리를 벡터화된 방식으로 처리합니다.
	- SIMD를 사용해 CPU 사용량을 최적화합니다.

위에서 다루지 않았지만 Polars의 가장 큰 특징인 **lazy evaluation**을 통해 매우 효율적으로 데이터 프레임을 처리할 수 있습니다.

![](https://i.imgur.com/E6NevEu.png){: w="800"}
그리고 Polars는 여느 오픈소스들과 다르게 잦은 업데이트를 통해 계속해서 기능을 추가해나가고 있습니다. 제법 많은 배포가 이루어졌음에도 현재 2주에 한 번은 새로운 버전이 배포되고 있으니까요. 초기에 비해서 배포 주기가 느려졌지만 여전히 자주 배포하고 있습니다. (사실 이렇게 되면 1.0.0이 나오기까지 추가할 기능이 많다고 해석할 수도 있습니다. 😅)

## Polars 사용하기

설치는 간단합니다.

```bash
pip install polars

# Install Polars with all optional dependencies
pip install 'polars[all]'
```

기본적인 문법은 Pandas랑 비슷하지만 대부분의 오퍼레이션이 행 단위로 진행되는 듯한 Pandas와 다르게 Polars는 **열 단위로 진행**하는 듯한 느낌을 받습니다.

```python
>>> import polars as pl
>>> df = pl.DataFrame(
...     {
...         "A": [1, 2, 3, 4, 5],
...         "fruits": ["banana", "banana", "apple", "apple", "banana"],
...         "B": [5, 4, 3, 2, 1],
...         "cars": ["beetle", "audi", "beetle", "beetle", "beetle"],
...     }
... )

# embarrassingly parallel execution & very expressive query language
>>> df.sort("fruits").select(
...     "fruits",
...     "cars",
...     pl.lit("fruits").alias("literal_string_fruits"),
...     pl.col("B").filter(pl.col("cars") == "beetle").sum(),
...     pl.col("A").filter(pl.col("B") > 2).sum().over("cars").alias("sum_A_by_cars"),
...     pl.col("A").sum().over("fruits").alias("sum_A_by_fruits"),
...     pl.col("A").reverse().over("fruits").alias("rev_A_by_fruits"),
...     pl.col("A").sort_by("B").over("fruits").alias("sort_A_by_B_by_fruits"),
... )
shape: (5, 8)
┌──────────┬──────────┬──────────────┬─────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ fruits   ┆ cars     ┆ literal_stri ┆ B   ┆ sum_A_by_ca ┆ sum_A_by_fr ┆ rev_A_by_fr ┆ sort_A_by_B │
│ ---      ┆ ---      ┆ ng_fruits    ┆ --- ┆ rs          ┆ uits        ┆ uits        ┆ _by_fruits  │
│ str      ┆ str      ┆ ---          ┆ i64 ┆ ---         ┆ ---         ┆ ---         ┆ ---         │
│          ┆          ┆ str          ┆     ┆ i64         ┆ i64         ┆ i64         ┆ i64         │
╞══════════╪══════════╪══════════════╪═════╪═════════════╪═════════════╪═════════════╪═════════════╡
│ "apple"  ┆ "beetle" ┆ "fruits"     ┆ 11  ┆ 4           ┆ 7           ┆ 4           ┆ 4           │
│ "apple"  ┆ "beetle" ┆ "fruits"     ┆ 11  ┆ 4           ┆ 7           ┆ 3           ┆ 3           │
│ "banana" ┆ "beetle" ┆ "fruits"     ┆ 11  ┆ 4           ┆ 8           ┆ 5           ┆ 5           │
│ "banana" ┆ "audi"   ┆ "fruits"     ┆ 11  ┆ 2           ┆ 8           ┆ 2           ┆ 2           │
│ "banana" ┆ "beetle" ┆ "fruits"     ┆ 11  ┆ 4           ┆ 8           ┆ 1           ┆ 1           │
└──────────┴──────────┴──────────────┴─────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

특히 가장 많이 사용하는 메서드는 `pl.lit()` 와 `pl.col()`, 그리고 `pl.DataFrame.select()` 일 듯 합니다. 
- 컬럼 인덱싱을 보통 리스트로 하는 Pandas와는 달리 Polars는 보통 `pl.DataFrame.select()` 를 사용하고, 위 코드 스니펫처럼 다른 용도로도 사용할 수 있습니다.
- `pl.lit()`은 literal 값을 갖는 변수를 만들 때 사용합니다. `pl.lit(1).alias("num")` 이라고 하면 모든 값이 `1`인 `num` 이라는 이름의 컬럼을 추가합니다. `pl.lit("hello").alias("hello")`라고 하면 모든 값이 `"hello"`인 `hello`라는 컬럼을 생성하죠.
- `pl.col()`은 어떤 오퍼레이션을 할 때의 대상 컬럼을 선정할 때 사용합니다. 위 스니펫에서도 대부분의 오퍼레이션에 `pl.col()`을 이용해 특정 컬럼을 지정하는 것을 확인하실 수 있습니다.

메서드에 대한 더 많은 정보는 [공식 문서](https://pola-rs.github.io/polars-book/)를 참고하시기 바랍니다. 😀

### 속도 비교

속도 비교 결과는 [H2O의 벤치마크 페이지](https://h2oai.github.io/db-benchmark/)를 통해서 확인하실 수 있습니다. 대부분의 경우에 Pandas보다 월등하게 빠른 속도를 보이는걸 알 수 있는데요. 체감으로는 데이터가 커지면 커질 수록 Pandas와의 속도 차이가 더 크게 느껴졌습니다.

## 아쉬운 점…?

속도 측면에서 월등한 모습을 보여 실제 업무할 때도 대부분의 데이터프레임 처리를 Polars로 하고 있지만 아쉬운 점이 조금 있습니다. Polars 자체의 문제라기 보다는 대부분 생태계 관점의 문제도 있긴 하지만요..

- 인덱스 개념이 없습니다.
	- 처음에 Polars를 사용할 때 당황했던 부분이 바로 이 부분입니다.
	- Pandas는 `pd.DataFrame.iloc`로 인덱스 접근을 많이 하는데 Polars는 인덱스가 없기 때문에 불가능합니다.
	- 그렇다고 속도가 느리진 않으므로 단점은 아니지만 처음 접하실 때 많이 당황하실거라 생각합니다.
	- 어차피 데이터 조인은 `left_on` 과 `right_on` 인자를 사용해서 진행하기 때문에 문제는 없습니다.
	- 좋게 생각하면 매번 Pandas에서 오퍼레이션 후에 해주는 `ignore_index=True` 나 `.reset_index(drop=True)`가 없다는 점이랄까요?
- Scikit-learn 호환이 안됩니다.
	- 당연하지만 Scikit-learn은 Pandas DataFrame이나 Numpy Ndarray를 입력으로 받기 때문에 Polars DataFrame을 사용할 수 없습니다.
	- 이런 점을 고려했던 것인지 Polars는 위의 두 자료형으로의 변환이 매우 간단합니다.
	- `.to_pandas()`, `.to_numpy()` 두 메서드를 이용하면 됩니다.
	- 저는 모든 작업을 Polars LazyFrame으로 lazy evaluation을 한 후 마지막에 Pandas로 바꿔서 필요한 작업들을 하는 편입니다.
	- 하지만 그래도 불편한 것은 사실입니다. 이건 위에서 말씀드린 생태계 관점의 문제라 솔직히 Polars가 해결할 문제는 아니라고 생각합니다.
- 아직은 사용자가 많지 않습니다.
	- 어쩔 수 없는 부분이지만 개발 중 막혔을 때 간혹 맨땅에 헤딩하는 경우가 발생합니다.
	- 시간이 해결해줄 문제라 열심히 공부하는 수 밖에 없을 것 같습니다. 😅

## 나가며

Polars는 속도도 빠르지만 마치 쿼리를 작성하는 느낌으로 코드를 짜게 되어서 어려움 없이 시작할 수 있습니다. 저도 새로운 프로젝트에서 큰 데이터를 빠르게 처리해야 하여 사용을 하게 되었는데, 지금은 이 정도 속도가 안나오면 답답함을 느끼고 있습니다. 다만 적응해야 할 부분이 여럿 있다는게 그나마 문제라고 할 수 있겠죠. 정말 다행인건 Polars의 문서는 매우 잘 정리되어 있습니다. 예시도 잘 되어 있으니 공부하실 때 한 번 쭉 정독해보시는 것을 추천드립니다. 평소에 Polars를 쓰시다가 궁금하신 내용이 있으면 언제든지 댓글 부탁드립니다. 😄