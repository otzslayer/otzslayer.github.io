---
title: Shapley Value란 무엇인가
tags: [xai, shapley-value, shap]
category: ML
layout: post
---


<!--more-->


본 포스트의 내용은 Christoph Molnar의 [Interpretable Machine Learning (IML)](https://christophm.github.io/interpretable-ml-book/)에 수록된 내용을 요약/정리한 것입니다. 더 자세한 내용은 해당 책을 참고하시기 바랍니다.

## Shapley Values

### 기본 아이디어

아파트 가격을 예측하기 위해 머신러닝 모델을 학습했습니다. 특정 아파트의 가격을 30만 유로로 예측했고, 우리는 그 예측에 대한 설명을 해야 합니다. 아파트는 <u>50제곱미터에 2층이며, 근처에 공원이 있고 고양이를 키울 수 없습니다.</u> 모든 아파트의 평균 가격은 31만 유로이라고 했을 때, 이 평균에 대비해 아파트 가격을 30만 유로로 예측하게 한 각 피처들의 기여도는 어떻게 될까요?


<center>
  <figure>
    <img src="/assets/images/2022-08-20-shapley-value-for-interpretable-ml/shapley-instance.png"
      alt="The predicted price for a 50 $m^2$ 2nd floor apartment with a nearby park and cat ban is €300,000. Our goal is to explain how each of these feature values contributed to the prediction." style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 1.</figcaption>
  </figure>
</center>

가장 간단한 방법은 선형회귀겠지만 보통 우리가 사용하는 복잡한 모델에 대한 좋은 방법은 아닙니다. 복잡한 모델을 위해서 **Shapley value**를 사용할 수도 있습니다. Shapley value는 노벨 경제학상 수상자인 Lloyd Shapley가 1953년에 만든 개념으로 협력 게임 이론 (cooperative game theory)에서 **전체 이익을 플레이어 각각의 기여도에 맞게 이익을 분배하는 방법**입니다. 

게임 이론에서 넘어온 개념이기에 관련 용어를 머신러닝에 맞춰 재정의할 필요가 있습니다.

-   Game : 데이터셋에서 단일 인스턴스에 대한 예측 태스크
-   Gain : 해당 단일 인스턴스에 대한 예측값에서 전체 인스턴스의 평균 예측값을 뺀 것
    -   위 아파트 예제에선 `-10000 = 300000 (the actual prediction) - 310000 (the average prediction)`
-   Players : 해당 단일 인스턴스의 피처들
    -   위 아파트 예제에선 `park-nearby`, `cat-banned`, `area-50`, `floor-2nd` 같은 피처들

**각 피처 (Players)가 예측값에 기여한 정도를 계산하는 것**이 Shapley value의 목적이 되는데요. Shapley value는 모든 가능한 피처 부분 집합에 대한 평균 이익 기여도 (average marginal contribution)가 됩니다. 쉽게 이해하기 위해서 예시를 들어보겠습니다.

우리는 `cat-banned`라는 피처의 기여도를 계산 해볼겁니다. 다른 피처의 값은 모두 같다고 하고 `cat-banned`만 다른 경우를 생각해보도록 하죠.

<center>
  <figure>
    <img src="/assets/images/2022-08-20-shapley-value-for-interpretable-ml/shapley-instance-intervention.png"
      alt="One sample repetition to estimate the contribution of `cat-banned` to the prediction when added to the coalition of `park-nearby` and `area-50`." style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 2.</figcaption>
  </figure>
</center>

`can-banned`인 경우엔 32만 유로, 아닌 경우엔 31만 유로로 예측되네요. 그러면 이 경우에서 `cat-banned` 의 기여도는 -1만 유로입니다. 여기서 중요한 점인 이 계산 하나만으로 `cat-banned`의 기여도 계산이 끝나는 것이 아닙니다. 정확한 기여도 계산을 위해, 다시 말해서 Shapley value를 정확하게 계산하기 위해서는 다른 모든 가능한 피처 부분 집합에 대해서도 이런 계산을 수행해야 하죠.

우선 "모든 가능한 피처 부분 집합"에 대해서 짚고 넘어갸아 할 것 같습니다. "모든 가능한 피처 부분 집합"이란 수학에서 말하는 멱집합 (power set)과 동일합니다. 기여도를 계산하는 대상은 `cat-banned` 피처를 제외한 나머지 피처들을 포함/제외하는 모든 경우의 수를 따져야 한다는 의미입니다. 그렇다면 세 개의 피처를 포함하거나 제외하기 때문에 총 $2^3 = 8$ 개의 경우의 수가 나오겠네요.

-   `No feature values`
-   `park-nearby`
-   `area-50`
-   `floor-2nd`
-   `park-nearby`+`area-50`
-   `park-nearby`+`floor-2nd`
-   `area-50`+`floor-2nd`
-   `park-nearby`+`area-50`+`floor-2nd`

이 모든 경우의 수에 대해서 `cat-banned` 인 경우와 `cat-allowed` 인 경우의 아파트 가격을 예측하여 `cat-banned` 피처의 기여도를 계산할 수 있고, 이 모든 경우의 기여도에 대해 가중 평균을 계산한 것이 바로 Shapley value가 됩니다.

### 조금 더 자세히 살펴보기

선형 모델의 경우 각 피처의 영향을 쉽게 알 수 있습니다. 인스턴스 $x$에 대해서 $1 \le j \leq p$개의 피처가 있다고 할 때 가중치 $\beta_j$를 이용해서 다음과 같이 나타낼 수 있기 때문이죠.

$$
\hat{f}(x) = \beta_0 + \beta_1 x_1 + \cdots + \beta_p x_p.
$$

그러면 예측값 $\hat{f}(x)$에 대한 $j$ 번째 피처의 기여도 $\phi_j$는 다음과 같습니다.

$$
\phi_j (\hat{f}) = \beta_j x_j - E(\beta_j X_j) = \beta_j x_j - \beta_j E(X_j).
$$

즉 $j$ 번째 피처의 기여도는 피처의 영향도에서 평균 영향도를 뺀 것과 같습니다. 만약 하나의 인스턴스에 대해 모든 피처의 기여도를 합하면 어떻게 될까요?

$$
\begin{aligned}
	\sum^p_{j=1} \phi_j (\hat{f}) &= \sum^p_{j=1} \left( \beta_j x_j - E(\beta_j X_j) \right) \\
	&= \left( \beta_0 + \sum^p_{j=1} \beta_j x_j \right) - \left( \beta_0 + \sum^p_{j=1} E(\beta_j X_j) \right) \\
	&= \hat{f}(x) - E(\hat{f}(X)).
\end{aligned}
$$

예측값에서 전체 데이터의 예측값 평균을 뺀 것과 같습니다. 

지금까지의 계산은 모두 선형 모델에 대한 내용입니다. 하지만 우리는 어떤 모델에서도 사용할 수 있는 방법을 찾아야 합니다. 이런 방법을 **Model-agnostic method**라고 합니다. Shapley value는 바로 이에 대한 해답이 될 수 있습니다.

#### The Shapley Value

Shapley value는 플레이어들의 가치 함수 (value function) $val$을 사용하여 정의합니다. Shapley value를 머신러닝에 맞춰 설명한다면, 피처의 Shapley value는 가능한 모든 가능한 피처 조합들의 기여도들의 가중치 합입니다. 모델에 사용한 피처들의 부분 집합 $S$, 피처의 개수 $p$에 대해서 다음과 같이 정의합니다.

$$
\phi_j(val) = \sum_{S \subseteq \{1, \cdots, p \} \backslash \{ j \}} \frac{|S|! (p - |S| - 1)!}{p!} \left(val(S \cup \{ j \}) - val(S) \right)
$$

데이터 인스턴스의 피처값 벡터인 $x$에 대해서 가치 함수 $val_x(S)$는 다음과 같이 정의합니다.

$$
val_x(S) = \int \hat{f} (x_1, \cdots, x_p) d \mathbb{P}_{x \not\in S} - E_X (\hat{f}(X)).
$$

이해를 위해 예시를 하나 들어보겠습니다. 피처 네 개를 학습한 머신러닝 모델이 있고 1번, 3번 피처를 사용한 경우의 가치 함수를 구하고자 합니다. 그러면 사용하지 않은 2번 피처와 4번 피처에 대해 [marginalization](https://towardsdatascience.com/probability-concepts-explained-marginalisation-2296846344fc)하면 됩니다. 

$$
val_x(S) = val_x(\{1, 3\}) = \int_\mathbb{R} \int_\mathbb{R} \hat{f} (x_1, X_2, x_3, X_4) d\mathbb{P}_{X_2X_4} - E_X (\hat{f}(X)).
$$

Shapley value는 다음 네 가지 특성을 만족합니다.

-   **Efficiency**

    -   모든 $j$에 대해서 $\phi_j$의 합은 항상 예측값에서 전체 예측값의 평균을 뺀 것과 같아집니다. 더 엄밀하게 말하자면 가치 함수와 같아집니다.

    -   $$
        \sum^p_{j=1} \phi_j = \hat{f}(x) - E_X(\hat{f}(X)).
        $$

-   **Symmetry**

    -   만약 두 피처 $j$와 $k$가 모든 부분집합 $S$에 들어가지 않고 두 피처를 각각 포함한 가치 함수가 같다면 두 피처의 기여도는 반드시 같습니다.
    -   If $val(S \cup \{ j\}) = val(S \cup \{ k \})$ for all $S \subseteq \{1, \cdots, p \} \backslash \{j, k \}$, then $\phi_j = \phi_k$

-   **Null player (Dummy)**

    -   피처 $j$가 예측값에 영향을 미치지 않는다면 피처 $j$에 대한 Shapley value는 반드시 0입니다.
    -   If $val (S \cup \{j\}) = val(S)$ for all $S \subseteq \{1, \cdots, p\}$, then $\phi_j = 0$

-   **Linearity**

    -   $\phi_j(val + val^+) = \phi_j(val) + \phi_j(val^+)$
    -   $\phi_j(a \times val) = a \cdot \phi_j(val)$

#### Estimating the Shapley Value

Shapley value를 정확하게 구하기 위해서는 $j$번째 피처를 넣고 뺀 것을 모두 계산해야 합니다. 피처 수가 적다면 괜찮지만, 피처가 많아지기 시작하면 계산양은 기하급수적으로 늘어납니다. 이런 문제를 해결하기 위해 몬테카를로 샘플링을 사용해 근사치를 계산할 수 있습니다.

$$
\hat{\phi}_j = \frac{1}{M} \sum^M_{m=1} \left( \hat{f}(x^m_{+j}) - \hat{f}(x^m_{-j}) \right)
$$

$\hat{f}(x^m_{+j})$는 $j$ 변수를 제외한 몇 개의 임의의 피처를 임의의 데이터 포인트 $z$로 치환한 $x$에 대한 예측값입니다. $\hat{f}(x^m_{-j})$는 앞선 값과 비슷하지만 $x^m_j$까지 임의의 데이터 포인트로 치환한 $x$에 대한 예측값입니다. 실제 근사치를 계산하는 알고리즘은 다음과 같습니다.

>   **Approximate Shapley estimation for single feature value:**
>
>   -   Output : Shapley value for the value of the $j$-th feature
>   -   Required : Number of iterations $M$, instance of interest $x$, feature index $j$, data matrix $X$, and machine learning model $f$
>   -   For all $m = 1, \cdots, M$ :
>       -   Draw random instance $z$ from the data matrix $X$
>       -   Choose a random permutation $o$ of the feature values
>       -   Order instance $x$ : $x_o = \left( x_{(1)}, \cdots, x_{(j)}, \cdots, x_{(p)} \right)$
>       -   Order instance $z$ : $z_o = \left( z_{(1)}, \cdots, z_{(j)}, \cdots, z_{(p)} \right)$
>       -   Construct two new instances
>           -   With $j$ : $x_{+j} = \left( x_{(1)}, \cdots, x_{(j-1)}, x_{(j)}, z_{(j+1)}, \cdots, z_{(p)} \right)$
>           -   Without $j$ : $x_{-j} = \left( x_{(1)}, \cdots, x_{(j-1)}, z_{(j)}, z_{(j+1)}, \cdots, z_{(p)} \right)$
>       -   Compute marginal contribution $\phi_j^m = \hat{f}(x_{+j}) - \hat{f}(x_{-j})$
>   -   Compute Shapley value as the average : $\phi_j(x) = \frac{1}{M} \sum^M_{m=1} \phi_{j}^m$

### 장단점

#### Advantages

첫 번째로 Shapley value의 Efficiency 특성입니다. 예측값과 예측값 평균의 차이는 **fairly distributed** 한데, 이 특성은 LIME과 같은 다른 방법들에선 보기 힘듭니다. LIME은 그 특성상 피처 전체에 대해 fairly distributed하지 않은데요. 이 특성으로 인해 Shapley value는 다른 방법들과 다르게 전체 설명을 다 해줄 수 있습니다.

두 번째로 Shapley value는 **대조적 설명 (contrastive explanations)**이 가능합니다. 예측값을 예측값 평균에 비교하는 것이 아니라 데이터 부분 집합이나 단일 데이터 포인트와 직접 비교할 수 있습니다. 이런 부분도 LIME같은 국소적 모델은 불가능합니다.

마지막으로 Shapley value는 다른 방법들과 다르게 탄탄한 이론에 기반을 두고 있습니다. LIME 같은 모델은 잘 작동할 수는 있으나, 왜 작동하는지에 대한 이론이 존재하지 않습니다.

#### Disadvantages

많은 장점들과 더불어 몇 가지 단점들도 있습니다. 우선 계산량이 매우 많습니다. Shapley value에 대한 정확한 계산을 위해서는 $k$개의 피처에 대해서 가능한 $2^k$ 번의 계산을 필요로 합니다. 이 때문에 샘플링을 활용하고 $M$ 번의 반복을 통해 근사치를 계산하여 계산량을 줄이려는 노력을 하지만 적당한 반복을 거치지 않으면 Shapley value의 분산이 커져 좋은 결과를 얻기 힘듭니다.

또한 Shapley value는 잘못 해석될 여지가 있습니다. 피처에 대한 Shapley value는 모델 학습으로부터 피처를 지우기 전 후의 예측값 차이가 아닙니다. 정확하게는 주어진 피처 집합에서 실제 예측값과 예측값 평균의 차이에 대한 기여도가 추정한 Shapley value가 되는거니까요. 또한 Shapley value는 sparse explanation에 사용해선 안됩니다. Shapley value는 모든 피처를 사용하여 설명을 생성하기 때문에 선택적인 설명이 필요하다면 LIME 같은 모델을 사용해야 합니다. SHAP 같은 방법이 이런 문제를 해결해줄 수 있습니다.

LIME 같은 예측 모델이 아니라는 아쉬운 점도 있습니다. 피처값의 변화가 예측값의 변화에 어떻게 영향을 미치는지는 알 수 없습니다.

마지막으로 새 데이터 인스턴스의 Shapley value를 꼐산하기 위해서는 데이터에 액세스해야 한다는 단점이 있습니다. 봐야 하는 데이터 인스턴스의 일부를 랜덤하게 뽑은 인스턴스의 값으로 바꾸기 위해선 데이터가 필요하기 때문에 예측 함수에 접근하는 것만으론 충분하지 않기 때문입니다. 이런 문제를 해결하려면 실제 데이터 인스턴스처럼 보이는 데이터 인스턴스를 생성하되 실제 학습 데이터에는 없는 데이터를 만들 수 있어야 합니다.

---

다음 포스트에선 Shapley value를 응용한 SHAP에 대해서 더 자세히 살펴보도록 하겠습니다.



