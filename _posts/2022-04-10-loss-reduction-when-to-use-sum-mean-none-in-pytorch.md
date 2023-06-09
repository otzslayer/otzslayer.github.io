---
title: PyTorch Loss에서 reduction의 선택
tags: [pytorch, loss-reduction]
category: PyTorch
layout: post
---


<!--more-->

## 들어가며

PyTorch로 된 여러 가지 구현체들을 보다보면 매번 loss function을 다루는 방식이 다른 것을 알 수 있습니다.
어떤 코드에선 배치마다 loss를 더하기도 하고 어떤 코드에선 그냥 두기도 합니다.

이미 구현이 되어 있는 `torch.nn` 내의 많은 loss 클래스들을 살펴보면 `reduction`이라는 인자가 있는 것을 알 수 있는데요.
이 인자가 하는 역할하고 연관이 있을까 하여 조금 정리해보았습니다.

## Loss reduction?

우선 PyTorch에서 제공하는 공식 문서에서 `reduction` 인자에 대해서는 보통 다음과 같이 설명하고 있습니다.

> -  **reduction** (*string, optional*) – Specifies the reduction to apply to the output: `none` / `mean` / `sum`.  
>	  -  `none`: no reduction will be applied  
>	  -  `mean`: the sum of the output will be divided by the number of elements in the output  
>	  -  `sum`: the output will be summed.   

즉 주어진 배치에 대해 loss를 계산하고 **loss의 형태를 어떻게 반환할 것인가**를 의미합니다.
어떤 것을 사용해야 하는가에 대해서는 PyTorch 커뮤니티에서도 많은 의견들이 오갔었는데요.
대부분 **`mean`을 사용하는 것이 무난하다**는 말을 많이 합니다.
저도 `mean`을 주로 사용하는데, 제가 `mean`을 사용하는 이유와 커뮤니티에서 `mean`을 사용하는 것이 낫다고 이야기하는 이유가 다행히도 같았습니다.

> I think **the disadvantage in using the sum reduction would also be that the loss scale (and gradients) depend on the batch size**, so you would probably need to change the learning rate based on the batch size. While this is surely possibly, a mean reduction would not make this necessary.  
> On the other hand, **the none reduction gives you the flexibility to add any custom operations to the unreduced loss and you would either have to reduce it manually** or provide the gradients in the right shape when calling backward on the unreduced loss.  
> [[Reference]](https://discuss.pytorch.org/t/loss-reduction-sum-vs-mean-when-to-use-each/115641/2)

사실 `mean`과 `sum`의 차이는 loss 값을 배치 크기로 나눠주는 것과 아닌 것의 차이입니다.
`torch.nn.CrossEntropyLoss` 문서를 보면 `reduction`에 따른 계산 차이를 이렇게 설명하고 있습니다.

$$
\ell(x, y) = 
  \begin{cases}
    \frac{\sum^N_{n=1} l_n}{N} & \text{if reduction = 'mean';} \\
    \sum^N_{n=1} l_n & \text{if reduction = 'sum'.}
  \end{cases}
$$

하지만 **`mean`을 권장하는 이유는 배치 사이즈에 독립적인 loss 값을 얻을 수 있다는 점**입니다.

`sum`으로 loss 값을 계산하는 경우 당연히 배치 크기가 작으면 낮은 loss 값을, 배치 크기가 크면 높은 loss 값을 반환하게 되는데, 
이 경우 loss scale이 배치 크기에 의존하기 때문에 learning late를 배치 크기에 맞춰 변경해야 하는 번거로움이 발생합니다.
하지만 `mean`은 매번 loss를 배치 크기로 normalize하는 것과 같은 효과를 가질 수 있기 때문에 배치 크기에 독립적이게 됩니다.
이런 점에서 대부분의 `torch.nn` 내의 loss 클래스들은 `reduction`의 기본값을 `mean`으로 설정하는 경우가 많습니다.

물론 배치 크기에 의존적인 하이퍼파라미터를 바꾸지 않아도 된다면 `sum`으로 사용해도 크게 문제가 없긴 합니다.
그래서 그런지 모르겠지만 요즘 PyTorch로 추천 논문들을 그대로 구현하면서 보게 되는 여러 레퍼런스 코드들은
이미 하이퍼파라미터를 정해놔서인지 모르겠지만 `sum`으로 하는 경우가 종종 있었습니다.