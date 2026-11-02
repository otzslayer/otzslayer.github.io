---
title: Hyperband
tags: [hpo, hyperband, sha, multi-fidelity]
category: ML
layout: post
---

📄 Li, Lisha, et al. "Hyperband: A novel bandit-based approach to hyperparameter optimization." *The Journal of Machine Learning Research* 18.1 (2017): 6765-6816.

<!--more-->


## 들어가며

### Successive Halving Algorithm의 문제

Hyperband의 기반이 되는 [Successive Halving Algorithm](https://otzslayer.github.io/ml/2022/12/24/successive-halving-algorithm.html)은 간단한 컨셉을 갖고 있으면서도 실제 성능도 좋은 알고리즘입니다. 하지만 **알고리즘에 입력값으로 사용되는 예산 $B$와 하이퍼파라미터 설정값 개수 $n$을 어떻게 설정하느냐에 따라 알고리즘의 방식이 크게 달라진다**는 문제가 있습니다.

SHA는 고정된 $B$ 값에 대해서 $n$ 값의 크기에 따라 알고리즘이 매우 다른 결과를 만듭니다. $n$ 이 클 수록 모델의 중간 손실 함수를 계산하는 횟수가 많아집니다. 정확하게는 $\lceil \log_2(n) \rceil$ 번 계산하기 때문입니다. 매번 모델의 중간 손실 함수를 계산함에 있어서 학습 Epoch 수는 다음과 같습니다.

$$
\text{\#Epoch} = \left\lfloor \frac{B}{|S_k| \lceil \log_2(n) \rceil} \right\rfloor
$$

따라서 $n$ 이 클 수록 한 번에 학습하는 Epoch 수는 줄어들게 됩니다. 만약 $n$ 이 크다면 여러 개의 하이퍼파라미터 설정을 테스트할 수 있지만 각각을 여러 번 학습할 수는 없습니다. 반대로 테스트하는 하이퍼파라미터 설정이 적다면 여러 번 학습하여 주어진 하이퍼파라미터 중 최적값을 찾아낼 수 있겠죠. 결국 **$B/n$ 의 값에 따라서 Exploration-Exploitation Trade-off가 발생**하고, 이는 알고리즘의 결과에 지대한 영향을 미칩니다.

>   **조금 더 자세하게!**
>
>   -   만약 $n$의 값이 커진다면 여러 개의 하이퍼파라미터 설정을 테스트하지만 여러 번 학습하지 못하므로 **Exploration**에 치중하게 됩니다.
>   -   반대로 $n$의 값이 작아진다면 적은 수의 하이퍼파라미터 설정을 깊게 학습하게 되므로 **Exploitation**에 치중하게 됩니다.

그렇다고 적절한 $n$ 값을 미리 알 수도 없습니다. 일반적으로 모델이 어떠한 학습 곡선을 그리는지 모르는 상태이기 때문인데요. 어떤 경우에는 모델의 하이퍼파라미터를 바꾸더라도 성능이 크게 변하지 않아 적은 수의 하이퍼파라미터만 테스트하면 될 수도 있습니다. 반대로 하이퍼파라미터의 값에 따라 성능이 많이 좌우되거나 모델의 수렴이 첫머리에 빠르게 이루어지는 경우엔 매우 다양한 하이퍼파라미터를 테스트해야 하므로 큰 $n$ 값을 설정해야 할 수도 있습니다.

### 아이디어

SHA에서 발생 가능한 문제는 고정된 예산 $B$ 에 대해서 **하이퍼파라미터 설정 개수인 $n$ 마저도 알고리즘의 입력값으로 활용하기 때문**입니다. Hyperband는 이 문제를 해결하기 위해 $n$ 을 입력값으로 받지 않고 자체적으로 설정되도록 했습니다. 또한 전체에 대한 예산을 먼저 설정하지 않고 하나의 하이퍼파라미터 설정에 대한 예산 $R$ 을 입력값으로 받습니다. 기존의 $B$ 는 자체적으로 설정되는 하이퍼파라미터 설정 개수에 $R$ 을 곱해서 얻게 됩니다. 

뿐만 아니라 $R$ 값이 커질 수록 다양한 하이퍼파라미터 설정에 대해 테스트할 수 있게 되며, 각각의 설정을 깊게 학습할 수 있게 되어 SHA에서 발생하는 트레이드오프 문제를 어느 정도 완화할 수 있습니다.

## Hyperband

![Pseudocode for Hyperband](https://i.ibb.co/V3cNRDv/hyperband-algorithm.png){: w="500"}
_Pseudocode for Hyperband_

Hyperband는 다음 순서대로 작동합니다.

-   하이퍼파라미터마다의 예산 $R$, 설정값 중 가져가야 할 비율 $\eta$를 입력값으로 받습니다. 이때 $\eta$의 기본값은 3입니다.
    -   논문에 따르면 적절한 $\eta$ 는 수학적으로 $\eta = e$ 라고 합니다. 실제로는 $\eta$는 3이나 4를 추천하고 있습니다.

-   입력값을 이용해 SHA를 수행할 횟수 (본 논문에서는 **bracket**이라고 부름)와 총 예산 $B$를 계산하여 초기화합니다.
    -   $s_\text{max} = \lfloor \log_\eta(R) \rfloor$, $B = (s_\text{max}+1) R$
-   각 $s \in \{ s_\text{max}, s_\text{max}-1, \cdots, 0 \}$ 마다 다음의 SHA를 수행합니다.
    -   최초 하이퍼파라미터 설정 개수와 학습 Epoch 수를 계산합니다.
        -   $n = \lceil \frac{B}{R} \frac{\eta^s}{(s+1)} \rceil$, $r = R\eta^{-s}$
            -   이때 하이퍼파라미터 설정은 특정 분포에서 i.i.d하게 샘플링합니다. 
        -   SHA를 수행합니다.
            -   각 단계마다의 하이퍼파라미터 설정 수는 $n_i = \lfloor n \eta^{-1} \rfloor$, 학습 Epoch 수는 $r_i = r \eta^i$ 입니다.
            -   모든 하이퍼파라미터 설정에 대해 $r_i$ 만큼 학습하여 성능이 좋은 $\lfloor n_i / \eta \rfloor$ 개 만큼의 하이퍼파라미터 설정을 저장합니다.
            -   저장한 하이퍼파라미터 설정에 대해 위 과정을 반복합니다. 
-   모든 결과에 대해서 가장 성능이 좋은 하이퍼파라미터 설정을 반환합니다.

### 실제 예시

실제 값을 대입하여 Hyperband가 어떻게 작동하는지 살펴보도록 하겠습니다. $R = 81, \eta = 3$으로 두겠습니다. 그렇다면 $s_\text{max} = \lfloor \log_\eta(R) \rfloor = 4$, $B = (s_\text{max}+1)R = 5 \cdot 81$이 됩니다. 따라서 Bracket의 수는 5가 됩니다. 이제 각각의 Bracket에 대해서 SHA를 수행하면 되는데요. $s$가 큰 순서대로 수행하면 됩니다.

1.   $s = s_\text{max} = 4$
     -   Bracket에서 테스트할 하이퍼파라미터 설정의 개수는 $n = \lceil \frac{B}{R} \frac{\eta^4}{(s+1)} \rceil = 81$이 되고, 학습할 Epoch 수는 $r = R\eta^{-s} = 81 \cdot 3^{-4} = 1$이 됩니다.
     -   여기서부터 SHA를 적용하면 되는데 SHA와의 차이는 **남기는 하이퍼파라미터 설정의 수**입니다. SHA는 설정의 반을 남겼다면 Hyperband에서는 $1/\eta$ 만큼을 남깁니다. 따라서 1 Epoch 학습 후 성능이 가장 좋은 $81 \cdot 1/\eta = 27$ 개의 설정만을 남깁니다.
     -   27개의 설정에 대해서 기존 학습 Epoch 수에 $\eta$ 만큼을 곱한 3회 학습을 더 하고 이번엔 9개의 설정을 남깁니다. 마지막 하나의 설정이 남을 때까지 이 과정을 반복합니다.
2.   $s = 3$
     -   Bracket에서 테스트할 하이퍼파라미터 설정 개수는 $n = \lceil \frac{B}{R} \frac{\eta^3}{(s+1)} \rceil = 34$ 가 되고 학습할 Epoch 수는 $r = R \eta^{-s} = 81 \cdot 3^{-3} = 3$ 이 됩니다.
     -   그러면 3 Epochs 만큼 학습하여 성능이 가장 좋은 11개를 남기고, 그 다음 다시 9회를 학습하여 3개를, 마지막으로 27회를 학습하여 마지막 한 개만을 남깁니다.

이 방법으로 모든 Bracket에 대해 SHA를 수행하면 됩니다. 다음 표는 모든 Bracket에 대해 각 단계마다 몇 개의 설정이 남고 몇 번의 학습을 수행했는지를 보여줍니다.

![Bracket examples for Hyperband](https://i.ibb.co/QF0dL7F/hyperband-brackets.png){: w="400"}
_Bracket examples for Hyperband_

## 나가며

Hyperband는 최근 [BOHB](https://arxiv.org/abs/1807.01774)가 많이 쓰이는 추세에서 그 기반이 되는 중요한 알고리즘입니다. Hyperband의 특징으로는 이론적 근거가 확실한 Successive Halving Algorithm을 고도화하였으며, 튜닝 초반에 매우 빠르게 ML 모델을 수렴시킬 수 있다는 점입니다. 또한 사용하는 입력값을 최소화하여 하이퍼파라미터 공간을 탐색하는 데에 있어 Exploration-Exploitation Trade-off를 줄였다는 점입니다.

![Figure from [1]](https://i.ibb.co/b1K74SC/hyperband-converges.png){: w="600"}
_Figure from [1]<br>학습 초기에는 랜덤 서치 대비 20배 빠르지만 충분한 시간이 주어졌을 때 그 차이가 크지 않게 됨._

다만 이 알고리즘의 아쉬운 점으로는 **이미 특정 Bracket에서 탐색한 결과를 다른 Bracket에서 그대로 다시 탐색할 수도 있다는 점**입니다. 매 Bracket마다 하이퍼파라미터 설정을 새로 샘플링하여 가져오기 때문에 발생하는 문제입니다. 또한 튜닝 초반에 빠르게 수렴하는데에 비해 시간이 충분히 흐른 후에는 기존 방법들에 비해 큰 개선이 없다는 것도 문제가 됩니다. 추후에 다룰 BOHB에서는 이 문제를 어느 정도 해결하는 것을 볼 수 있습니다. 다음 포스트에서는 BOHB에 대해서 알아보도록 하겠습니다.

## 레퍼런스

[1] [https://neptune.ai/blog/hyperband-and-bohb-understanding-state-of-the-art-hyperparameter-optimization-algorithms](https://neptune.ai/blog/hyperband-and-bohb-understanding-state-of-the-art-hyperparameter-optimization-algorithms)