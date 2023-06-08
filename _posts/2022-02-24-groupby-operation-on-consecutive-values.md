---
title: 연속적인 값에 대해 Group-by operation 수행하기
tags: [pandas, groupby]
category: Pandas
aside:
  toc: true
show_category: true
---


<!--more-->

## 들어가며

Pandas의 Group-by operation은 `apply`나 `transform` 메서드를 이용하여 데이터 그룹에 대한 처리를 편하게 할 수 있게 해줍니다.
Pandas를 이용해서 데이터를 처리하다보면 어떻게든 한 번은 사용하게 되는 operation이죠.
하지만 매번 단순한 데이터 전처리를 하게 되지는 않습니다. 
원하는 형태로 데이터를 만지다 보면 독특한 상황을 맞닥뜨리게 됩니다.
오늘 포스트에선 그런 상황 중 하나에 대해서 다뤄보도록 하겠습니다.

## 문제

다음과 같은 데이터 프레임이 있다고 가정해보겠습니다.

{% highlight python linenos %}
import numpy as np
import pandas as pd

np.random.seed(0)
name = np.random.choice(["A", "B", "C"], size=10, replace=True)
value = np.random.choice(10, size=10, replace=True)

df = pd.DataFrame({"name": name, "value": value})
{% endhighlight %}

```python
  name  value
0    A      1
1    B      6
2    A      7
3    B      7
4    B      8
5    C      1
6    A      5
7    C      9
8    A      8
9    A      9
```

이 데이터에 대해 일반적인 group-by operation이 아닌 `name` 컬럼을 기준으로 연속적인 값들을 하나의 그룹으로 설정하여 연산을 하고자 합니다.
만약 **연속적인 값들을 그룹으로 설정하여 `value`가 가장 큰 경우를 반환**한다면 이렇게 되겠죠.

```python
  name  value
0    A      1
1    B      6
2    A      7
3    B      8
4    C      1
5    A      5
6    C      9
7    A      9
```

어떻게 하면 될까요?

## 해결

조금 어려워 보이지만 몇 가지 트릭을 사용하면 생각보다 간단하게 해결할 수 있습니다.
우선 `name` 컬럼을 한 칸씩 아래로 밀었다고 생각해봅시다.
그 컬럼의 이름을 `name_push`라고 한다면 아래와 같습니다.

```python
df["name_push"] = df["name"].diff()

  name name_push
0    A       NaN
1    B         A
2    A         B
3    B         A
4    B         B
5    C         B
6    A         C
7    C         A
8    A         C
9    A         A
```

여기서 **`name`과 `name_push`가 같은 행이 있다면 그 행은 바로 이전 행과 연속적인 값을 이루고 있다는 것**을 알 수 있습니다.
그럼 새로운 컬럼인 `flag`에 해당 정보를 저장하겠습니다.

```python
df["flag"] = df["name"] != df["name_push"]

  name name_push   flag
0    A       NaN   True
1    B         A   True
2    A         B   True
3    B         A   True
4    B         B  False
5    C         B   True
6    A         C   True
7    C         A   True
8    A         C   True
9    A         A  False
```

이제 이 정보를 이용해서 매우 간단하게 연속적인 값을 가지는 경우 그룹을 짓도록 할 수 있습니다.
**`flag` 컬럼에 대해 누적합을 계산**하면 됩니다.
연속적인 값이 있을 때 `flag` 컬럼의 값은 `False`가 되기 때문에 누적합의 변동이 발생하지 않기 때문입니다.

```python
df["group"] = df["flag"].cumsum()

  name name_push   flag  group  value
0    A       NaN   True      1      1
1    B         A   True      2      6
2    A         B   True      3      7
3    B         A   True      4      7
4    B         B  False      4      8
5    C         B   True      5      1
6    A         C   True      6      5
7    C         A   True      7      9
8    A         C   True      8      8
9    A         A  False      8      9
```

다섯 번째 행과 마지막 행을 살펴보면 `name == name_push`가 되면서 누적합의 변화가 발생하지 않아 동일한 그룹으로 설정이 되었습니다.
마지막으로 `group` 컬럼에 대해 `groupby()` 메서드를 사용하면 됩니다.

```python
df.groupby("group").max()[["name", "value"]].reset_index(drop=True)

  name  value
0    A      1
1    B      6
2    A      7
3    B      8
4    C      1
5    A      5
6    C      9
7    A      9
```

지금까지의 복잡한 과정을 조금 더 단순하게 하면 아래 코드가 됩니다.

{% highlight python linenos %}
df["group"] = (df["name"] != df["name"].shift()).cumsum()
df.groupby(["group"]).max().reset_index(drop=True)
{% endhighlight %}