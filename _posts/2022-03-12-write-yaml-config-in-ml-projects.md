---
title: ML 프로젝트에서 YAML 파일을 설정 파일로 사용하기
tags: [yaml, configuration]
category: ML
aside:
  toc: true
show_category: true
layout: post
---


<!--more-->

## 들어가며

ML 프로젝트를 하다보면 모델에 필요한 많은 하이퍼파라미터를 포함해서 설정값을 관리하는 것이 매우 중요해집니다.
많은 실험을 통해 최적의 성능을 갖는 하이퍼파라미터 집합을 찾았는데 이를 제대로 관리하지 못하게 되면 까먹게 된다면 지금까지 들였던 시간을 다시 들여야하니까요.
그런데 재현성이 그 무엇보다 중요한 ML 프로젝트에서도 생각보다 이런 일은 제법 허다하게 일어납니다.

여러 이유가 있을 수 있습니다. 
Jupyter notebook을 사용하게 되면 여러 셀에 모델 설정값을 써놨다가 어떤 설정으로 지금의 결과를 얻었는지 헷갈리는 경우도 있습니다.
그래서 모델 소스 코드에 매번 변경되는 설정값을 적어서 관리하는 분들도 많으시더라구요.
매우 권장하지 않는 방법이긴 합니다.
소스 코드 내에서 하이퍼파라미터와 같은 모델 설정값을 관리하게 되면 코드가 지저분하게 될 수도 있고, 지금까지의 실험 결과에 대한 트래킹이 어려워질 수도 있기 때문입니다.
그래서 이번 포스팅에서는 YAML 파일을 사용하여 모델 설정값을 관리하는 방법에 대해 알아보겠습니다.

## 왜 YAML?

사실 설정 파일로 무조건 YAML을 쓰지 않아도 됩니다.
과거부터 사용되어왔던 INI, JSON, CFG 등 사용할만한 포맷은 많습니다.
YAML은 보통 JSON과 가장 많이 비교가 되는데요.
REST API 응답 등에 사용할 때는 JSON만한 포맷이 없습니다.
하지만 **다른 포맷 대비 읽기 쉽고 작성하기 쉽다는 장점** 때문에 ML 설정 파일에는 YAML을 많이 사용하는 편입니다.
주석을 달 수도 있고, 괄호 하나 없이 들여쓰기 만으로 잘 정리된 설정 파일을 작성할 수 있으니까요.
개인적으로 가장 중요한 이유라고 생각하는 요소는 멀티바이트 문자를 인식하는 데에 어려움이 없다는 점입니다.
다른 이유도 많지만 ML 프로젝트에서 설정 파일로 YAML을 써야하는 이유는 [이 아티클](https://towardsdatascience.com/5-reasons-to-use-yaml-files-in-your-machine-learning-projects-d4c7b9650f27)에 잘 설명이 되어 있습니다.

## 사용법

Learning to Rank 포스트에서 LightGBM를 이용해 LambdaRank를 간단하게 사용하는 법 [(링크)](http://otzslayer.github.io/ml/2022/02/13/learning-to-rank.html#ltr-using-lightgbm-lambdarank)을 공유드렸었는데요.
해당 코드를 다시 쓰되 사용한 설정값들을 YAML 파일로 어떻게 관리할 수 있는지 알아보겠습니다.

해당 포스트를 다시 보시면 관리해야 할 설정값은 크게 경로, 하이퍼파라미터 정도입니다.
이렇게 정리할 수 있을 것 같습니다.

- 경로
  - 학습 데이터 경로
  - 검증 데이터 경로
- LightGBM 하이퍼파라미터
  - `task`
  - `objective`
  - `metric`
  - `...`

이걸 그대로 YAML 파일에 다시 적으면 유효한 설정 파일이 됩니다.

{% highlight yaml linenos %}
# config.yaml

path:
  train_path: ./data/rank.train
  valid_path: ./data/rank.test
params:
  task: train
  objective: lambdarank
  metric: ndcg
  num_leaves: 31
  min_data_in_leaf: 50
  bagging_freq: 1
  bagging_fraction: 0.9
  min_sum_hessian_in_leaf: 5.0
  ndcg_eval_at: [1,3,5]
  learning_rate: 0.01
  num_threads: 8
{% endhighlight %}

이렇게 작성한 파일을 Python에서 불러오기 위해서는 `PyYAML`을 설치해야 합니다.
설치는 간단하게 `pip`를 이용하면 됩니다.

```bash
$ pip install pyyaml
```

그리고 다음과 같은 함수를 통해서 YAML 파일을 불러올 수 있습니다.

{% highlight python linenos %}
import yaml

def load_config(config_file):
    with open(config_file) as file:
        config = yaml.safe_load(file)

    return config

cfg = load_config("config.yaml")
{% endhighlight %}

불러온 설정 파일은 다음과 같이 딕셔너리 형태로 저장이 됩니다.

```python
{'path': {'train_path': './data/rank.train', 'valid_path': './data/rank.test'},
 'params': {'task': 'train',
  'objective': 'lambdarank',
  'metric': 'ndcg',
  'num_leaves': 31,
  'min_data_in_leaf': 50,
  'bagging_freq': 1,
  'bagging_fraction': 0.9,
  'min_sum_hessian_in_leaf': 5.0,
  'ndcg_eval_at': [1, 3, 5],
  'learning_rate': 0.01,
  'num_threads': 8}}
```

딕셔너리 형태이기 때문에 똑같이 key-value 형태로 사용할 수 있습니다.
만약 학습 데이터를 불러온다면 다음과 같이 할 수 있겠죠.

```python
train_data = lgb.Dataset(cfg["path"]["train_path"])
```

하이퍼파라미터의 경우 원래 입력값으로 딕셔너리를 받기 때문에 더욱 간단합니다.

```python
bst = lgb.train(
    cfg["params"],
    train_data,
    valid_sets=[valid_data],
    valid_names=["valid"],
    num_boost_round=100,
    verbose_eval=1,
    early_stopping_rounds=5,
)
```

## References

[1] [How to Write Configuration Files in Your Machine Learning Project by Davis David](https://medium.com/analytics-vidhya/how-to-write-configuration-files-in-your-machine-learning-project-47bc840acc19)

[2] [How to Track Hyperparameters of Machine Learning Models? by Kamil Kaczmarek](https://neptune.ai/blog/how-to-track-hyperparameters)