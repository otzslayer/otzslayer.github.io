---
title: An Introduction to Sparse Matrices
tags: [scipy, sparse-matrix, python, coo, csr, csc]
category: Python
aside:
  toc: true
show_category: true
layout: post
---

대부분 0으로 이루어진 행렬을 굳이 다 쓸 필요는 없는데 말이죠.

<!--more-->

## Introduction

행렬(Matrix)은 ML 전반에서 매우 많이 쓰입니다. 행렬을 분류하는 방법은 여러 가지지만 가장 흔하게 쓰이는 방법은 행렬의 값들에 얼마나 0이 많은가에 따라 구분하는 방법입니다. 행렬에 0이 매우 많은 경우를 **희소하다 (sparse)**고 하며 반대로 대부분 0이 아닌 행렬을 **조밀하다(dense)**고 합니다.

특히 ML에선 희소한 행렬들을 많이 사용하게 됩니다. 추천 시스템에서 사용하는 일반적인 사용자-아이템 행렬을 떠올려보면 쉬운데요. 각 사용자는 서비스에서 제공하는 수많은 아이템 중 일부만을 상호작용하게 되는데, 상호작용하지 않은 모든 아이템은 행렬에서 0 값을 가집니다. 그렇게 되면 이 행렬에서 대부분의 값은 0으로 채워지게 되죠. 다른 예시로 NLP에서 많이 사용하는 단어 문서 행렬 (Term-Document Matrix, TDM)이 있습니다. TDM에서 각 행은 문서, 각 열은 단어가 되는데, 문서가 많은 경우 서로 사용하는 단어가 다르기 때문에 행렬 대부분의 값이 0이 됩니다.

희소 행렬(Sparse matrix)은 아무래도 너무 많은 0 값 때문에 불필요하게 행렬의 크기가 커집니다. 행렬의 크기가 커지면 **점유하는 메모리도 늘어나고 계산 비용도 매우 커집니다.** 이런 문제를 해결하기 위해 희소 행렬을 표현하는 여러 가지 방법이 있는데요. 본 포스트에서는 Python에서 지원하는 희소 행렬 표현법에 대해서 다루도록 하겠습니다.

## Sparse Matrix

### COO (COOrdinate List)

좌표 리스트라고도 부르는 COO 형식은 **(행, 열, 값) 형태의 triplet의 목록으로 0이 아닌 값들을 저장**합니다. Python에선 `scipy.sparse.coo_matrix()`로 COO 형식을 사용할 수 있습니다. COO 형식의 희소 행렬을 생성하는 방법은 다양한데요. 크게 밀집 행렬(dense matrix)을 그대로 변환하는 방법과 데이터 값과 행, 열의 인덱스 값을 통해 생성하는 방법이 있습니다.

-   밀집 행렬을 사용하는 방법
    -   밀집 행렬 `D`가 주어졌을 때 `coo_matrix(D)`로 생성할 수 있습니다.

```python
import numpy as np
from scipy.sparse import coo_matrix

D = np.array([[3,0,1], [0,2,0]])

# >>> D
# array([[3, 0, 1],
#        [0, 2, 0]])

coo_D = coo_matrix(D)

# >>> coo_matrix(D)
# <2x3 sparse matrix of type '<class 'numpy.int64'>'
# 	with 3 stored elements in COOrdinate format>

coo_D.get_shape()
# (2, 3)

coo_D.row
# array([0, 0, 1], dtype=int32)

coo_D.col
# array([0, 2, 1], dtype=int32)

coo_D.data
# array([3, 1, 2])
```

-   Triplet을 사용하는 방법
    -   각 값에 대한 행, 열 인덱스를 이용해 `coo_matrix((data, (row, col)))`로 만들 수 있습니다.

```python
row = np.array([0, 0, 1])
col = np.array([0, 2, 1])
data = np.array([3, 1, 2])

# Triplet
# 1. (3, (0, 0))
# 2. (1, (0, 2))
# 3. (2, (1, 1))

coo_D = coo_matrix((data, (row, col)))

coo_D.toarray()
# array([[3, 0, 1],
#        [0, 2, 0]])
```



COO 형식은 다음과 같은 장단점이 있습니다.

-   장점
    -   중복 엔트리를 허용합니다.
        -   중복 엔트리 값들은 합 연산되어 저장됩니다.
        -   점진적인 행렬 구성에 유용한 형식입니다.
    -   CSR/CSC 형식과의 변환이 빠릅니다.
-   단점
    -   Slicing이나 사칙 연산을 직접적으로 지원하진 않습니다.

### CSR (Compressed Sparse Row)

CSR 형식은 **COO 형식에서 사용하는 triplet에서 행의 인덱스를 압축하여 사용하는 형식**입니다. 다음과 같은 행렬이 있습니다.

$$
{\displaystyle A_{IJ}={\begin{pmatrix}{\underset {({\color {Blue}0},{\color {Green}0})}{10}}&0&0&{\underset {({\color {Blue}0},{\color {Green}3})}{12}}&0\\0&0&{\underset {({\color {Blue}1},{\color {Green}2})}{11}}&0&{\underset {({\color {Blue}1},{\color {Green}4})}{13}}\\0&{\underset {({\color {Blue}2},{\color {Green}1})}{16}}&0&0&0\\0&0&{\underset {({\color {Blue}3},{\color {Green}2})}{11}}&0&{\underset {({\color {Blue}3},{\color {Green}4})}{13}}\\\end{pmatrix}}}
$$

위 행렬을 COO 형식으로 나타낸다고 하면 다음과 같습니다.

```python
data = [10, 12, 11, 13, 16, 11, 13]
col = [0, 3, 2, 4, 1, 2, 4]
row = [0, 0, 1, 1, 2, 3, 3]
```

여기에서 `row`를 `[최초 시작행 번호, 시작행에서의 데이터 수, 두 번째 행까지의 누적 데이터 수, ..., 마지막 행까지의 누적 데이터 수]` 형태로 압축하는 것이 CSR 형식의 특징입니다. 최초 시작행 번호는 0이며, 시작행에서의 데이터 수는 2, 그 다음 행까지의 누적 데이터 수는 4입니다. 이런 규칙으로 압축하면 `row`는 이렇게 쓸 수 있습니다.

```python
row = [0, 2, 4, 5, 7]
```

CSR 형식은 `scipy.sparse.csr_matrix()`로 생성할 수 있는데 `coo_matrix()`와 동일하게 밀집 행렬로부터 만들거나 triplet을 통해서 만들 수 있습니다. 이번에는 CSR만의 독특한 형태인 압축한 행 인덱스를 사용하여 만들어 보겠습니다.

```python
from scipy.sparse import csr_matrix

data = [10, 12, 11, 13, 16, 11, 13]
indices = [0, 3, 2, 4, 1, 2, 4]  # col
indptr = [0, 2, 4, 5, 7]  # compressed row

csr_A = csr_matrix((data, indices, indptr))
# <4x5 sparse matrix of type '<class 'numpy.int64'>'
# 	with 7 stored elements in Compressed Sparse Row format>

csr_A.toarray()
# array([[10,  0,  0, 12,  0],
#        [ 0,  0, 11,  0, 13],
#        [ 0, 16,  0,  0,  0],
#        [ 0,  0, 11,  0, 13]])
```

CSR 형식은 다음과 같은 장단점이 있습니다.

-   장점
    -   CSR 형식간 사칙 연산이 효율적이며 행 단위의 슬라이싱을 지원합니다.
    -   행렬 벡터 곱이 빠릅니다.
-   단점
    -   컬럼 단위의 작업이 느립니다.
    -   Sparsity structure를 바꾸는 것의 복잡도가 다소 높습니다.

### CSC (Compressed Sparse Column)

CSC 형식은 CSR 형식과 비슷한데 **행의 인덱스가 아닌 열의 인덱스를 압축**하는 방법입니다. 위에서 사용한 행렬 예제를 이용해서 CSC 형식으로 나타내면 `data`, `col`, `row`는 다음과 같이 다시 쓸 수 있습니다. 이 때 CSR 형식과 다르게 `data`는 첫 번째 열부터 열 단위로 값을 입력합니다.

```python
data = [10, 16, 11, 11, 12, 13, 13]
col = [0, 1, 2, 4, 5, 7]
row = [0, 2, 1, 3, 0, 1, 3]
```

CSC 형식은 CSR과는 다르게 `col`을 `[최초 시작열 번호, 시작열에서의 데이터 수, 두 번째 열까지의 누적 데이터 수, ..., 마지막 행까지의 누적 데이터 수]` 형태로 압축합니다.

CSC 형식은 `scipy.sparse.csc_matrix()`로 생성할 수 있습니다.

```python
from scipy.sparse import csc_matrix

data = [10, 16, 11, 11, 12, 13, 13]
indices = [0, 2, 1, 3, 0, 1, 3]  # row
indptr = [0, 1, 2, 4, 5, 7]  # compressed col

csc_A = csc_matrix((data, indices, indptr))
# <4x5 sparse matrix of type '<class 'numpy.int64'>'
# 	with 7 stored elements in Compressed Sparse Column format>

csc_A.toarray()
# array([[10,  0,  0, 12,  0],
#        [ 0,  0, 11,  0, 13],
#        [ 0, 16,  0,  0,  0],
#        [ 0,  0, 11,  0, 13]])
```

CSC 형식은 CSR 형식과 유사한 장단점을 갖고 있습니다. 차이가 있다면 CSR 형식이 컬럼 단위의 작업이 느린 반면 CSC 형식은 행 단위의 작업이 느립니다. 또한 CSR 형식이 CSC 형식에 비해 행렬 벡터 곱이 조금 더 빠릅니다.

