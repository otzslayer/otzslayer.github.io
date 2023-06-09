---
title: model.zero_grad()와 optimizer.zero_grad()의 차이
tags: [pytorch, zero-grad]
category: PyTorch
layout: post
---


<!--more-->

## 들어가며

PyTorch로 구현된 여러 코드들을 보면 무조건 보이는 메서드가 있는데 바로 `zero_grad()` 입니다.
PyTorch 문서를 보면 다음과 같이 설명하고 있습니다.

> `torch.optim.optimizer.zero_grad`  
> Sets the gradients of all optimized `torch.Tensor`s to zero.

한 줄로 짧게 쓰여져 있는데, 이 메서드는 해당 옵티마이저에서 최적화하는 파라미터들의 그라디언트를 모두 0으로 만들어줍니다.
이 메서드는 보통 이렇게 쓰이죠.

```python
import torch.optim as optim

optimizer = optim.Adam(model.parameters())

...

optimizer.zero_grad()
loss.backward()
optimizer.step()
```

`loss.backward()`를 통해서 Loss의 그라디언트를 역전파하는데, 이때 `optimizer.zero_grad()`를 하지 않으면 기존에 저장되어 있었던 값이 영향일 미치면서 올바르게 역전파되지 못하게 됩니다.
그래서 반드시 `loss.backward()`를 하기 전에 `zero_grad()` 메서드를 호출해서 텐서를 0으로 만들어주고 역전파를 시켜야 합니다.

## 그런데...

간혹 위 코드 스니펫과 다른 형태로 코드가 짜여져 있는 경우가 있습니다.

```python
import torch.optim as optim

optimizer = optim.Adam(model.parameters())

...

model.zero_grad()
loss.backward()
optimizer.step()
```

이렇게 `optimizer.zero_grad()`가 아니라 `model.zero_grad()`처럼 모델에 대해서 `zero_grad()` 메서드를 적용하는 경우가 종종 있습니다.
뭘로 하더라도 학습 결과에 큰 차이가 없었기 때문에 두 개의 차이가 무엇인지 조금 헷갈렸었습니다.
두 개의 차이는 **모델 내 파라미터의 그라디언트를 0으로 만드는가와 옵티마이저에서 최적화하는 파라미터에 대한 그라디언트를 0으로 만드는가**에 있습니다.
복잡하지 않은 모델의 경우를 살펴보면 대부분 모델 내의 파라미터 집합은 하나의 옵티마이저로 최적화하게 됩니다.
이 경우에는 `optimizer.zero_grad()`와 `model.zero_grad()`가 동일한 역할을 합니다.

하지만 모델이 조금 복잡해져서 모델 내에 서브모듈들이 서로 다른 옵티마이저를 사용하는 경우에는 `model.zero_grad()`가 훨씬 편한 방법이 될 수 있습니다.
모든 그라디언트를 0으로 만들기 위해서 옵티마이저에 대해 `zero_grad()`를 수행하려면 여러 개의 옵티마이저에 대해 `zero_grad()`를 모두 수행해야 되기 때문이죠.
이때는 모델 전체의 파라미터에 대해 한 번에 그라디언트를 0으로 만들도록 `model.zero_grad()`가 편하겠죠.
반대의 경우엔 `optimizer.zero_grad()`가 더 편한 방법이 될거구요.

즉 요약하면 다음과 같습니다.

> 모델 내의 파라미터와 옵티마이저에서 최적화하는 파라미터가 같다면 `optimizer.zero_grad()`와 `model.zero_grad()`가 하는 일은 같다.
> 하지만 모델 내의 파라미터와 옵티마이저에서 최적화하는 파라미터가 서로 다르다면 조금 더 포괄적인 방향으로 사용하면 된다.
