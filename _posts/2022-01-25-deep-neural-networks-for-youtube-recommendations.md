---
title: Deep Neural Networks for YouTube Recommendations
tags: [recsys, youtube, two-stage-model]
category: ML
aside:
  toc: true
show_category: true
layout: post
---

Covington, Paul, Jay Adams, and Emre Sargin. "Deep neural networks for youtube recommendations." Proceedings of the 10th ACM conference on recommender systems. 2016.


<!--more-->

## Introduction

유튜브 영상 추천은 다음 세 가지 측면에서 매우 어렵습니다.

- Scale : 사용자가 많고 영상도 많기 때문에 고도화된 분산 학습 알고리즘과 효율적인 서빙 시스템이 매우 중요합니다.
- Freshness : 많은 영상이 실시간으로 업로드되기 때문에 새로운 영상과 기존 영상들 사이의 균형을 맞추는 것이 Exploration/Exploitation 관점에서 중요합니다.
- Noise : 데이터의 sparsity와 수많은 외부 요인으로 인해 사용자에 대한 ground truth가 부족하고 noisy한 implicit feedback이 많습니다.

전체 ML 시스템은 TensorFlow로 구현되어 있습니다. 수 천억 개의 데이터로 모델을 학습하며 모델은 10억 개의 파라미터로 구성되어 있습니다.

## System Overview

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220116183400139.png" alt="System overview" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 1. System Overview</figcaption>
  </figure>
</center>

ML 시스템은 두 개의 뉴럴 네트워크로 구성되어 있습니다.

- 후보 생성 (Candidate generation) 네트워크
  - 사용자의 유튜브 사용 이력 (시청한 영상 ID, 검색 쿼리 토큰, 인구통계학적 정보 등)을 입력값으로 하여 수 백개의 영상만을 추려내는 역할을 합니다.
  - Collaborative Filtering을 이용해 사용자가 좋아할 것 같은 영상을 high precision으로, 그리고 대략적(coarse)으로 추려냅니다.
- 랭킹 (Ranking) 네트워크
  - High recall로 후보군 내에서 상대적인 중요도를 부여합니다.

이와 같은 Two-stage approach를 사용하는 이유는 우선 사용자-영상 Corpus가 너무나 크기 때문에 확장성 있는 추천을 하기 위함입니다. 모든 영상에 대해서 순위를 매기는 것보다 후보 생성 네트워크에서 추천할 영상의 수를 줄이고 랭킹 네트워크에서 순위를 매기는 것이 훨씬 빠르기 때문입니다. 그리고 다른 소스로부터 생성된 후보 영상과의 앙상블이 가능해진다는 장점도 있습니다.

논문에서는 개발 과정에서 Precision, Recall, Ranking loss 등의 오프라인 메트릭을 폭넓게 사용했다고 말합니다. 하지만 알고리즘이나 모델의 유효성에 대한 최종 결정은 CTR, 시청 시간 등을 기준으로 한 A/B 테스트를 활용했다고 합니다. 당연하게도 A/B 테스트 결과와 오프라인 실험의 결과는 항상 일치하지 않았구요.

## Candidate Generation

기존에는 WARP loss를 이용한 Matrix Factorization을 사용했다고 합니다. 또한 사용자의 시청 이력만을 사용하는 얕은 네트워크를 사용했다고 하네요.

### Recommendation as Classification

이 논문에서 재밌는 부분 중 하나는 영상 추천 후보군 생성을 굉장히 클래스가 많은 분류 문제 (extreme multiclass classification)로 생각했다는 점입니다.
특정 사용자 정보와 컨텍스트 정보가 주어질 때 시간 $t$에 영상 $i$를 시청할 확률을 다음과 같이 정의합니다.

$$
P(w_t = i \mid U, C) = \frac{e^{v_i u}}{\sum_{j \in V} e^{v j^u}} \label{eq1} \tag{1}
$$

- $w_t = i$ : 시간 $t$에 영상 $i$를 시청
- $u \in \mathbb{R}^N$ : 사용자 임베딩으로 사용자 정보 $U$와 컨텍스트 정보 $C$의 조합
- $v_j \in \mathbb{R}^N$ : 영상 임베딩

$\eqref{eq1}$ 을 보면 확률값이 일종의 Softmax 함수 형태로 되어 있는 것을 알 수 있습니다.
즉 특정 시간 $t$에 주어진 사용자 정보와 컨텍스트 정보가 있을 때 해당 확률을 최대화하는 $i$를 찾는 문제로 재정의합니다.

이 때 시청 여부에 대해서 모델링을 하는 것이 의아할 수 있습니다.
논문을 인용하자면 유튜브엔 당연히 좋아요, 내부 서베이 등 explicit feedback이 있지만 시청 이력이 많지 않은 longtail 영상들은 이런 정보가 굉장히 적기 때문에 시청 여부에 대한 implicit feedback을 사용한다고 합니다.
사용자가 해당 영상을 끝까지 봤다면 positive한 데이터가 되는 형태로 말이죠.

#### Efficient Extreme Multiclass

멀티 클래스 분류 문제로 생각했을 때 클래스 수가 영상의 수랑 동일하다보니 클래스가 너무나 많아서 학습 속도에 대한 고민을 할 수 밖에 없습니다.
우선 오프라인 학습 때는 네거티브 샘플링 (negative sampling)을 사용했다고 합니다.
그리고 각 클래스 (영상)마다 cross-entropy loss를 최소화하여 학습을 했는데, 실제로 일반적인 softmax를 학습할 때보다 약 100배 이상 빠르게 학습이 가능했다고 합니다.
Hierarchical softmax도 고려해봤지만 너무 복잡하고 애초에 성능이 하락하는 문제가 있어서 사용하지 않았다고 합니다.

서빙 시에는 사용자에게 Top N 영상을 추천해줘야 하기 때문에 확률값이 높은 N 개의 클래스를 찾아야 합니다.
이 때는 낮은 latency를 요구하기 때문에 기존과 유사한 hashing 기법을 이용해서 스코어링을 합니다.
결국 Dot product space에서 nearest neighbor를 찾는 것과 동일하기 때문에 Approximate Nearest Neighbor를 이용해서 찾습니다.
논문에서는 어떤 ANN 알고리즘을 사용하더라도 A/B 테스트 결과가 크게 차이가 없었다고 합니다.

### Model Architecture

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220118232559811-2515962.png" alt="Model Architecture" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 2. Architecture of Candidate Generation Network</figcaption>
  </figure>
</center>

우선 사용자의 시청 이력을 임베딩합니다.
Figure 2에서 왼쪽 아래에 있는 파란색 벡터들입니다.
각 영상의 임베딩 벡터를 평균 내서 입력값으로 사용했다고 합니다.
임베딩 벡터의 합, component-wise max도 시도해보았지만 평균이 가장 좋은 성능을 보였다고 합니다.
그리고 네트워크는 FC layer + ReLU 조합을 사용했습니다.

### Heterogeneous Signals

- 검색 기록도 위에서 언급한 시청 이력과 유사하게 처리합니다.
  - 우선 각 검색 쿼리를 unigram, bigram으로 토큰화합니다.
    그리고 각 토큰을 임베딩해서 평균 계산을 해주면 됩니다.
    Figure 2에서 녹색 벡터들입니다.

- 인구통계학적 정보들도 학습 시 사용하는데, 이런 정보들은 신규 사용자들에게 매우 중요합니다. 
  - 신규 사용자들은 시청 이력이 없기 때문에 Cold start 문제가 발생할 수 있는데, 사용자에 대한 기초적인 정보들은 적당한 추천을 생성해줄 수 있기 때문입니다.
- 논문에 따르면 사용자의 지역 정보, 디바이스 정보 등은 임베딩하여 concatenate해서 사용했다고 합니다.
  - Figure 2에서는 보라색 벡터로 표시되어 있습니다.
- 성별이나 로그인 상태, 나이 등은 $[0, 1]$로 normalize해서 사용합니다.

#### "Example Age" Feature

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220119220809578.png" alt="Example Age" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 3. Example Age</figcaption>
  </figure>
</center>

일반적인 사용자들도 경험을 통해 알겠지만, 유튜브에서는 최근에 올라온 영상들을 추천하는 것이 매우 중요합니다.
그래서 저자들은 사용자가 얼마나 새로운 영상을 선호하는지를 조사했다고 합니다.

기본적으로 ML 시스템은 과거 데이터를 이용해서 미래를 예측하기 때문에 알게 모르게 과거 데이터에서 비롯된 편향이 생깁니다.
다시 말해서 과거 데이터를 학습하기 때문에 과거에 올라온 영상들을 더 많이 추천하게 되죠.
저자들은 이런 문제를 해결하기 위해 학습할 때 **영상의 나이**를 피처로 사용했다고 합니다.
서빙 시에는 해당 피처를 0이나 아주 작은 음수로 설정하고요.
해당 피처를 사용했을 때 업로드한 지 얼마 안 된 영상들을 많이 보는 사용자의 경향을 잘 따라가는 것을 Figure 3을 통해서 알 수 있습니다.

### Label and Context Selection

추천 시스템은 종종 다른 문제 (surrogate problem)를 해결하는 것으로 원하는 결과를 얻을 수 있습니다.
예를 들어 영화 추천을 할 때 영화를 직접 추천하기 보다는 영화의 평점을 예측하는 것처럼 말이죠.
하지만 어떤 방식으로 문제를 해결하는가는 A/B 테스트를 수행할 때 성능에 매우 중요한 부분을 차지하는 반면 오프라인 실험에선 큰 차이를 보이지 않았다고 합니다.

학습 데이터의 경우 추천 결과에 노출된 영상 중 시청한 영상만 사용하는 것이 아니라 다른 웹사이트에도 임베드 되어 있는 영상까지 포함해서 사용합니다.
이렇게 하지 않으면 추천되었던 영상만 계속 추천하는 편향 문제가 발생하기 때문입니다.
다시 말해서 Exploration 대비 Exploitation이 과하게 발생합니다.

라이브 메트릭 성능을 높일 수 있는 또 하나의 중요한 인사이트는 사용자별로 고정된 숫자만큼의 예시를 샘플링하는 것입니다.
이렇게 하면 모든 사용자마다 loss function에 동일한 가중치를 줄 수 있고, 사용량이 많은 사용자가 loss function에 큰 영향을 미치는 것을 막을 수 있습니다.

또한, 직관에는 반하는 내용일 수 있지만, 추천 결과나 검색 결과와 같은 정보를 실시간으로 반영하지 않고 *보류*하는 것도 중요합니다.
아까 검색한 내용이 계속해서 추천되는 것을 방지하기 위함입니다.
순서 정보를 제거하기 위해 검색 쿼리의 경우 순서가 없는 bag of tokens를 사용합니다.

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220119231328077.png" alt="Choosing labels and input context" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 4. Choosing labels and input context</figcaption>
  </figure>
</center>

사용자가 영상을 소비하는 일반적인 패턴은 매우 비대칭적입니다.
에피소드가 있는 영상들은 에피소드의 순서로 소비합니다.
노래의 경우 대중적인 장르에서 점차 마이너한 장르로 옮겨가게 됩니다.
그래서 일반적인 CF 학습처럼 홀드아웃 (hold-out) 데이터를 예측하는 것보단 미래의 시청 여부를 예측하는 것으로 학습하는 것이 좋습니다.
Figure 4는 이 개념에 관해 설명하고 있습니다.
실제로 미래의 시청 여부를 예측하는 경우에 A/B 테스트 결과가 더 좋았습니다.

### Experiments with Features and Depth

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220120154915513.png" alt="Experiments with Features and Depth" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 5. Experiments with Features and Depth</figcaption>
  </figure>
</center>

Figure 5는 각 피처 세트별로 네트워크의 깊이가 성능에 어떤 영향을 미치는지를 보여줍니다.
영상 백만 개, 검색 쿼리 백만 개를 256차원으로 임베딩하고 최대 bag size를 최근 시청 이력 50개, 최근 검색쿼리 50개로 설정하였다고 합니다.
네트워크의 깊이가 깊을수록 홀드 아웃 MAP의 성능이 더 좋은 것을 볼 수 있습니다.

## Ranking

<center>
  <figure>
    <img src="/assets/images/2022-01-24-deep-neural-networks-for-youtube-recommendations/image-20220120161055424.png" alt="Experiments with Features and Depth" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 6. Architecture of Ranking Network</figcaption>
  </figure>
</center>

랭킹 네트워크에선 후보 생성 네트워크보다 학습에 사용하는 데이터가 적기 때문에 더 많은 피처를 사용합니다.
전체적인 구조는 후보 생성 네트워크와 유사합니다만 마지막에 각 후보 영상에 스코어를 매길 때 logistic regression을 사용합니다.
랭킹에 대한 목적함수는 A/B 테스트를 통해 꾸준히 튜닝한다고 하는데 일반적으로 **노출 대비 시청 시간**에 대한 함수 형태를 지닙니다.
그 이유에 대해서 논문에서는 CTR만 사용했을 때 결과에 대한 신뢰가 어려워지기 때문이라고 말합니다.
CTR로만 측정하게 되면 사용자에게 도움이 되지 않는 클릭베이트 (clickbait) 영상을 누르는 경우도 고려하기 때문입니다.

### Feature Representation

논문에서는 본 추천에 사용된 피처들을 다음과 같이 분류하고 있습니다.

- 일반적인 분류
  - Continuous / Ordinal
- 값의 형태
  - Univalent : 단일값 (ex. Scoring할 영상 ID)
  - Multivalent : 여러 개의 값 (ex. 최근에 본 N개의 영상 ID)
- 값의 특성
  - Impression : 영상에 대한 피처
  - Query : 사용자/컨텍스트에 대한 피처

#### Feature Engineering

딥러닝이 피처를 직접 엔지니어링 하는 수고를 덜어준다고 하지만 원본 데이터를 그대로 네트워크에 태울 수 없어서 매우 많은 피처를 직접 생성했다고 합니다.

그렇게 생성한 피처 중에서 가장 중요한 피처는 **사용자의 과거 인터랙션** 정보입니다.
**특정 채널에서 얼마나 많은 영상을 보았는지, 최근에 이 주제에 대한 영상을 얼마나 보았는지** 등의 피처들이 성능에 큰 영향을 미쳤다고 합니다.
기타 중요한 피처로는 이런 것들이 있다고 합니다.
- 어떤 소스에서 이 영상이 후보로 선정되었는지
- 어떻게 스코어가 매겨졌는지
- 과거에 추천 목록에 해당 영상이 얼마나 등장했는지
  - 이 피처의 경우, 연속한 추천 지면 요청에 동일한 리스트를 반환하지 않기 위함입니다.
  - 사용자에게 영상을 추천했을 때 해당 영상을 시청하지 않았다면 그 순위를 점차 낮춰가는 방식을 사용합니다.
  

#### Embedding Categorical Features

영상 ID나 검색 쿼리 등 cardinality가 큰 범주형 피처들은 빈도 기반으로 정렬하여 상위 N개만 임베딩하는 방식을 사용했다고 합니다.
상위 N개를 제외하고는 모두 0으로 처리하고요.
값이 여러 개인 범주형 피처(multivalent categorical feature)에 대한 임베딩은 평균 계산하여 네트워크에 입력값으로 사용합니다.

이때 노출된 영상 ID, 사용자가 마지막에 본 영상 ID, 추천에 seed된 영상 ID가 모두 같으면 같은 임베딩을 공유합니다.
하지만 네트워크에 대한 서로 다른 입력값의 역할을 합니다.

#### Normalizing Continuous Features

연속형 피처들은 $[0, 1)$로 scaling하여 사용합니다.
이때 피처값의 quantile의 근사치로 매핑되도록 합니다.

그리고 scaling한 값을 $x^2$, $\sqrt{x}$로도 변환하여 입력값으로 사용합니다.
네트워크가 여러 비선형값을 학습할 수 있도록 하기 위함입니다.
이렇게 했을 때 오프라인 실험 시 정확도 향상이 있었다고 합니다.

### Modelling Expected Watch Time

이 네트워크는 주어진 학습 데이터에서 노출된 영상을 클릭했는지, 클릭하지 않았는지 예측하는 것이 목적입니다.
이를 위해서 별도로 개발한 Weighted logistic regression을 사용했다고 합니다.

학습 시에는 cross-entropy loss를 사용하였다고 합니다.
Positive한 데이터와 negative한 데이터에 대해 가중치를 다르게 주도록 세팅하였는데 positive 데이터는 시청 시간만큼의 가중치를 갖고, negative한 데이터에 대해서는 unit weight를 갖습니다.

이 구조로 학습했을 때 네트워크가 깊을수록 성능이 더 좋았다고 합니다.
하지만 서빙 시 속도를 고려해야 했기 때문에 무작정 깊은 네트워크를 사용할 수는 없었다고 합니다.
