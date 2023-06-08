---
title: SHAP (SHapley Additive exPlanations) In Theory
tags: [xai, shap]
category: ML
aside:
  toc: true
show_category: true
---


<!--more-->

본 포스트의 내용은 Christoph Molnar의 [Interpretable Machine Learning (IML)](https://christophm.github.io/interpretable-ml-book/)에 수록된 내용을 요약/정리한 것입니다. 더 자세한 내용은 해당 책을 참고하시기 바랍니다.

## Definition

2017년에 발표된 SHAP(SHapley Additive exPlanations)은 게임 이론적으로 최적화한 Shapley value를 기반에 둔 설명 기법입니다. 예측값의 각 피처의 기여도를 계산하여 데이터 인스턴스 $x$의 예측 결과를 설명하는 것이 목적인데요. 지난 번 포스트에서 다루었던 것처럼 데이터 인스턴스의 각 피처값은 coalition (연합)의 player가 됩니다. Player는 단일 피처값이 될 수도 있고 여러 피처값이 될 수 있습니다. SHAP이 ML 모델 설명에 기여한 부분은 Shapley value 설명을 **Additive feature attribution method**로 표현한 점입니다. 이는 LIME과 Shapley value를 연결하는 관점이 됩니다.

SHAP은 다음과 같습니다.

$$
g(z^\prime) = \phi_0 + \sum^M_{j=1} \phi_j z_j^\prime
$$

-   $g$ : 설명 모델
-   $z^\prime \in \{ 0, 1 \}^M$ : 연합 벡터 (coalition vector)
-   $M$ : 최대 연합 크기
-   $\phi_j \in \mathbb{R}$ : 피처 $j$에 대한 피처 어트리뷰션 (feature attribution) $\rightarrow$ Shapley value

여기서 연합 벡터는 "단순화된 피처 (simplified features)"를 의미합니다. 이 값이 0이면 해당 피처는 빠지고, 1이면 해당 피처를 사용하게 됩니다. 만약 연합 벡터의 모든 값이 1이라면 모든 변수에 대해 계산을 하게 되고, 위 식은 다음과 같이 단순해집니다.

$$
g(x^\prime) = \phi_0 + \sum^M_{j=1} \phi_j
$$

### SHAP의 특성

Shapley value는 지난 포스트에서 다루었듯이 Efficiency, Symmetry, Dummy, Additivity를 모두 만족하는 방법론이었는데요. SHAP 역시 Shapley value를 계산하기 때문에 이 특성들을 모두 만족합니다. SHAP은 다음 세 가지 특성을 추가로 갖고 있습니다.

-   **Local accuracy**

    -   $$
        \hat{f}(x) = g(x^\prime) = \phi_0 + \sum^M_{j=1} \phi_j x^\prime_j
        $$

    -   $\phi_0 = E_X(\hat{f}(x))$로 두고 모든 $x_j^\prime = 1$로 두면 Shapley value에서 Efficiency 특성과 동일합니다.

    -   $$
        \hat{f}(x) = \phi_0 + \sum^M_{j=1} \phi_j x^\prime_j = E_X(\hat{f}(X)) + \sum^M_{j=1}\phi_j
        $$

-   **Missingness**

    -   $$
        x_j^\prime = 0 \implies \phi_j = 0
        $$

    - Missingness 특성은 결측 피처는 0의 어트리뷰션을 가짐을 말합니다.

    - 일반적인 Shapley value에는 없는 특성입니다.

    - 결측 피처는 $x^\prime_j = 0$을 곱하기 때문에 Local accuracy 특성을 해치지 않은 상태에서 임의의 Shapley value 값을 가질 수 있습니다. 이 특성은 결측 피처가 0의 Shapley value를 갖도록 하는 강제하는 특성으로, 보통 상수값을 가지는 피처와 연관이 있습니다.

-   **Consistency**

    -   $\hat{f}\_x(z^\prime) = \hat{f}(h_x(z^\prime))$ 이라 두고 $z^\prime_{\backslash j}$ 가 $z^\prime_j = 0$ 을 나타낼 때, 모든 입력값 $z^\prime \in \{ 0, 1 \}^M$ 에 대해서 다음을 만족시키는 두 모델 $f$ 와 $f^\prime$ 이 있다고 가정해봅시다.

        $$
        \hat{f}^\prime_x (z^\prime) - \hat{f}^\prime_x(z^\prime_{\backslash j}) \geq \hat{f}_x(z^\prime) - \hat{f}_x(z^\prime_{\backslash j})
        $$

        그러면 다음을 만족합니다.

        $$
        \phi_j \left( \hat{f}^\prime, x \right) \geq \phi_j \left( \hat{f}, x \right).
        $$

    -   이 특성은 모델이 피처 값의 marginal contribution이 증가하거나 같다면 Shapley value 역시 증가하거나 같음을 의미합니다.

## KernelSHAP

KernelSHAP은 SHAP 커널을 이용해서 예측값에 대한 각 피처값의 기여도를 추정하는 방법입니다. KernelSHAP은 다음 순서대로 기여도를 추정합니다.

>1.   $k \in \{ 1, \cdots, K \}$에 대해 연합 벡터 $z^\prime_k \in \{ 0, 1 \}^M$를 샘플링
>2.   각 $z^\prime_k$에 대해 $z^\prime_k$를 기존 피처 공간으로 변환하여 예측값을 얻고 이를 모델 $\hat{f}: \hat{f}(h_x(z^\prime_k))$에 적용시킴
>     -   $h_x(z^\prime) = z \quad \text{ where } h_x : \{ 0, 1 \}^M \to \mathbb{R}^p$
>     -   $z^\prime = 0$ 인 경우는 해당 피처가 임의의 값으로 샘플링 됩니다.
>3.   SHAP 커널을 통해 각 $z^\prime_k$에 대한 가중치를 계산
>4.   가중 선형 모델에 적합
>5.   선형 모델의 계수가 Shapley value 가 되며 이를 반환

$X_C$가 빠진 피처들의 집합이고 $X_S$가 존재하는 피처들의 집합이라고 했을 때, 2번에 나오는 Tabular data에 대한 함수 $h_x$는 $X_C$와 $X_S$를 독립적으로 보면서 이를 marginal distribution으로 두고 적분하게 됩니다.

$$
\hat{f}(h_x(z^\prime)) = E_{X_C}[\hat{f}(x)]
$$

이런 식으로 marginal distribution에서 샘플링을 하게 되면 존재하는 피처들과 빠진 피처들간의 의존성을 무시하게  되는데요. 그러다보니 KernelSHAP은 다른 permutation 기반의 해석 방법들과 비슷한 **존재하지 않을 법한 인스턴스들에 더 큰 가중치를 주게 되는** 문제를 겪게 됩니다. 이를 해결하기 위해서는 가치 함수를 변경해 조건부 분포로부터 샘플링을 하는 것이고, 따라서 Shapley value가 해결책이 됩니다. 그 결과 Shapley value는 조금 다른 해석을 하게 되는데요. 모델에서 사용하지 않았을법한 피처가 조건부 분포로 인해 0이 아닌 Shapley value 값을 가지게 됩니다. 원래 Shapley value라면 Dummy 공리로 인해 일어날 수 없지만요.

### LIME 과의 차이

LIME 과의 가장 큰 차이는 회귀 모델에서 각 인스턴스에 대한 가중치에서 찾을 수 있습니다. LIME은 기존 인스턴스에 얼마나 가까운 정도에 따라 가중치를 부여합니다. 연합 벡터 관점에서 이야기하자면 0이 많을 수록 LIME에서의 가중치는 작아지죠. 하지만 SHAP은 Shapley value를 추정함에 있어서 연합이 얻을 수 있는 가중치에 따라 샘플링된 인스턴스에 가중치를 부여합니다. 아주 작은 연합이나 매우 큰 연합이 더 큰 가중치를 갖게 됩니다.

만약 연합이 하나의 피처만을 포함하고 있다면 우리는 예측값에 대한 해당 피처의 주요 영향력을 알 수 있습니다. 반대로 연합이 하나의 피처를 제외하고 모든 피처를 포함하고 있다면 이 피처의 전체 영향 (피처의 주요 영향력과 피처 상호작용에 따른 영향력)을 알 수 있게 됩니다. 하지만 연합이 절반의 피처로 구성이 된다면 절반을 구성할 수 있는 연합의 경우의 수가 많기 때문에 각 피처에 대한 영향력을 알기 어렵습니다.

Lundberg et al. 에서는 Shapley value와 호환되는 가중치를 얻기 위해서 다음과 같은 SHAP 커널을 제안하였습니다.

$$
\pi_x(z^\prime) = \frac{(M-1)}{\binom{M}{|z^\prime|} |z^\prime | (M - |z^\prime |)}
$$

-   $M$ : 최대 연합 크기
-   $\lvert z^\prime \rvert$ : 인스턴스 $z^\prime$에 포함된 피처 개수

Lundberg et al. 에서는 이 커널 가중치를 갖는 선형 회귀 모형으로 Shapley value를 얻을 수 있음을 보였습니다. 만약 연합 데이터에 대해 Shap 커널을 활용한 LIME을 사용한다면 LIME 역시 Shapley value를 얻을 수 있게 됩니다.

### 조금 더 똑똑하게 샘플링하기

위에서 언급한 것과 같이 가장 작은 연합과 가장 큰 연합이 가중치의 대부분을 차지합니다. Shapley value를 추정하기 위해 제한적인 상황에서 무작정 샘플링하는 것보다 높은 가중치를 갖는 연합들을 샘플링을 하는 것이 중요할텐데요. 우선 한 개, 또는 $M-1$ 개의 피처로 이루어진 연합을 만듭니다. (모두 $2 \times M$ 개의 연합이 만들어집니다.) 샘플링에 대한 예산(budget)이 $K$ 였다면 남은 예산은 $K-2M$ 이 됩니다. 그 다음엔 두 개, 또는 $M-2$개로 이루어진 연합을 포함하고, 그 다음은 세 개, 또는 $M-3$개로 이루어진 연합을 포함하는 방식인거죠. 

지금까지의 내용을 정리해보았을 때, 저희가 필요한 건 가중 선형 회귀 모형을 만드는 것입니다.

$$
g(z^\prime) = \phi_0 + \sum^M_{j=1} \phi_j z_j^\prime
$$

그리고 학습 데이터 $Z$에 대해 다음 손실 함수 $L$을 최적화하여 선형 모델 $g$를 학습합니다.

$$
L(\hat{f}, g, \pi_x) = \sum_{z^\prime \in Z} \left[ \hat{f}(h_x(z^\prime)) - g(z^\prime) \right]^2 \pi_x(z^\prime)
$$

이를 통해 얻게 되는 추정된 모델 계수 $\phi_j$가 바로 Shapley value가 됩니다. 

## TreeSHAP

TreeSHAP은 의사결정나무나 랜덤 포레스트, 그라디언트 부스팅 트리 같은 트리 기반의 모델에 사용하는 SHAP의 변형입니다. 트리 기반 모델에 KernelSHAP 대신 사용하는 매우 빠른 방법이지만 기존 KernelSHAP보단 덜 직관적인 결과를 얻게 됩니다.

TreeSHAP은 Marginal expectation 대신 조건부 기댓값인 $E_{X_S \vert X_C} \left( \hat{f}(x) \vert x_s \right) $를 가치 함수로 사용합니다. 위에서도 언급했듯이 조건부 기댓값을 가치 함수로 사용하게 되면 모델에서 사용하지 않았을법한 피처에 0이 아닌 값이 나오게 됩니다. 보통 피처가 높은 상관성을 갖는 경우에 발생합니다. 

그럼에도 TreeSHAP을 사용하게 되는 이유는 바로 **속도**입니다. KernelSHAP과 비교하였을 때 트리의 수 $T$, 트리 내의 리프 노드의 수 $L$, 트리의 깊이 $D$에 대해서 계산 복잡도는 $O(TL2^M)$에서 $O(TLD^2)$ 까지 줄어듭니다.

### 자세히 살펴보기

데이터 인스턴스를 $x$, 피처 부분 집합을 $S$로 두겠습니다. 만약 $S$가 모든 피처를 포함하고 있다면 $x$가 포함되어 있는 노드에 대한 예측은 기대 예측값이 될겁니다. 만약 $S$가 모든 피처를 포함하지 않는 공집합이라면 모든 터미널 노드의 예측값의 가중 평균이 기대 예측값이 됩니다. 그리고 $S$가 일부 피처만을 포함하고 있다면 **도달 불가능한 (unreachable)** 노드에 대한 예측값은 무시하게 됩니다. 남아 있는 터미널 노드로부터 노드 크기 (해당 노드에 있는 학습 데이터 샘플 수)에 맞춰 예측값에 대한 가중 평균이 기대 예측값이 됩니다.

>   여기서 **도달 불가능한 노드**란 주어진 피처 부분집합 $S$의 인스턴스 $x_s$와 모순되는 결정 경로 (decision path)를 갖는 노드를 의미합니다.

이제 남은 일은 지금까지의 과정을 피처값에 대한 모든 가능한 부분 집합 $S$에 대해서 수행하는 것입니다. TreeSHAP은 위에서 언급한 것처럼 이 작업을 지수 시간이 아닌 다항 시간에서 해결합니다. 가장 기본적인 아이디어는 가능한 모든 부분 집합 $S$를 동시에 트리 아래로 태우는 것입니다. 각 결정 노드 (decision node)에 대해 부분 집합의 수를 계속 추적해야 합니다. 이는 상위 노드의 부분 집합과 스플릿 피처에 따라 다릅니다. 예를 들어 트리에서 첫 번째 스플릿을 피처 $x_3$에 대해서 수행하였다면 피처 $x_3$를 포함하는 모든 부분 집합은 하나의 노드로 ($x$가 가는 곳으로) 이동하게 됩니다. $x_3$을 포함하지 않는 부분 집합은 감소한 가중치를 갖고 양쪽 노드로 이동합니다. 여기서 중요한 점은 다른 크기의 부분 집합은 다른 가중치를 갖는다는 사실입니다. 따라서 알고리즘은 각 노드에 대해 부분 집합의 전체 가중치를 계속 추적해야 합니다. 이 점이 알고리즘을 복잡하게 만듭니다. 

Shapley value의 Additivity property로 인해 트리 앙상블의 Shapley value는 단순히 각 트리의 Shapley value 평균으로 얻을 수 있습니다.

## 장단점

### 장점

-   SHAP은 Shapley value에 기반을 두기 때문에 Shapley value가 갖는 장점을 모두 가지고 있습니다. **게임 이론에 탄탄한 기반을 둔 방법론**이며 피처값에 대해 f**airly distributed한 예측값**을 갖습니다. 또한 **대조적 설명 (contrastive explanation)**이 가능합니다.
-   SHAP은 **LIME과 Shapley value를 연결**해주는 방법론입니다.
-   트리 기반 모델애 대한 **빠른 구현체**를 갖고 있습니다. Shapley value는 너무 느리단 단점이 있었는데 이 문제를 충분히 해결할만 합니다.
-   속도가 빠르기 때문에 **전역적인 모델 해석**도 가능합니다. 전역적인 모델 해석엔 피처 중요도, 피처 의존성, 상호작용, 클러스터링 등 많은 것들이 포함됩니다.

### 단점

-   KernelSHAP은 매우 느립니다.
-   KernelSHAP은 피처 의존성을 무시합니다. 다른 permutation 기반 방법론에서 나타나는 문제와 동일합니다. 실제 피처값을 임의의 인스턴스로 치환하는 부분 때문에 발생하는 이 문제는 특히 피처가 상관성을 띄는 경우에 두드러집니다.
-   TreeSHAP은 조건부 기댓값을 사용하기 때문에 직관적이지 않은 피처 어트리뷰션을 생성할 수 있습니다.
-   SHAP의 장점이 Shapley value의 장점을 갖는다는 것처럼 Shapley value의 단점도 갖고 있습니다.


