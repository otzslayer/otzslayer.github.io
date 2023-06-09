---
title: PyTorch의 Native Automatic Mixed Precision 사용하기
tags: [amp, mixed-precision, pytorch]
category: ML
aside:
  toc: true
show_category: true
layout: post
---


<!--more-->

<center>
  <figure>
    <img src="/assets/images/2022-03-27-how-to-use-native-amp-in-pytorch/andrea-sonda-nw2H5tAhR4I-unsplash.jpg" style="zoom:33%;" loading="lazy" />
    <figcaption style="text-align: center;">Photo by <a href="https://unsplash.com/@andreasonda">Andrea Sonda</a> on <a href="https://unsplash.com">Unsplash</a></figcaption>
  </figure>
</center>

## 들어가며

이미 이전에 Automatic Mixed Precision과 관련된 포스트를 게시한 적이 있습니다. 
[[링크]](https://otzslayer.github.io/ml/2022/01/31/automatic-mixed-precision.html)
APEX를 이용해서도 충분히 AMP를 사용할 수 있지만 PyTorch 1.6 버전부터 자체적으로 지원하는 AMP를 사용하면 APEX가 갖고 있는 여러 문제를 해결 할 수 있습니다.
PyTorch에서 말하는 자체 AMP의 장점은 다음과 같습니다. [[링크]](https://pytorch.org/blog/accelerating-training-on-nvidia-gpus-with-pytorch-automatic-mixed-precision/)

- PyTorch의 일부분이기 때문에 버전 호환성이 보장됨
- 추가 빌드가 필요하지 않음
- 윈도우 지원
- 체크포인트 저장 시 Bitwise 정확도가 더 높음
- DataParallel`과 내부 프로세스의 모델 병렬화
- 그라디언트 페널티 (Double backward)
- 여러 번 `apex.amp.initialized()`를 호출할 필요 없이 AMP가 켜져 있지 않은 영역 말고는 `torch.cuda.amp.autocast()`가 아무런 영향을 미치지 못함
- Sparse gradient 지원

개인적으로는 추가 빌드가 필요하지 않다는게 가장 큰 장점이었습니다.
최근에 개인적인 용도로 GCP를 사용하는데 PyTorch가 설치되어 있는 환경을 사용하는데 APEX를 설치하는 것이 매우 번거롭더라구요.
제가 실수한걸 수도 있지만 CUDA 버전과 PyTorch 버전, APEX 버전이 다 맞지 않는 문제가 발생해서 설치가 쉽지 않았습니다.
그래서 자체적인 AMP를 사용하게 되었구요.

## 사용하기

APEX를 사용할 때는 모델과 옵티마이저에 대해서 `model, optimizer = amp.initialize(model, optimizer)`로 초기화를 해서 썼었는데요.
PyTorch 자체 AMP를 사용하면 위에서 언급한 것과 같이 그럴 필요가 없습니다.
`torch.cuda.amp.autocast()`로 정해진 영역에 대해서만 아래처럼 활성화할 수 있습니다.

```python
from torch.cuda.amp import autocast

with autocast():
    output = model(input)
    loss = loss_fn(output, target)
```

그리고 그라디언트를 스케일링할 때는 `torch.cuda.amp.GradScaler()`를 이용합니다.

```python
from torch.cuda.amp import GradScaler

scaler = GradScaler()

for epoch in epochs:
    for input, target in data:
        ...

        scaler.scale(loss).backward()
        scaler.step(optimizer)
        scaler.update()
```

전체 코드는 다음과 같습니다. 아래 코드는 [PyTorch 문서](https://pytorch.org/docs/stable/notes/amp_examples.html)에서 가져왔습니다.

{% highlight python linenos %}
import torch.optim as optim
from torch.cuda.amp import GradScaler, autocast

# Creates model and optimizer in default precision
model = Net().cuda()
optimizer = optim.SGD(model.parameters(), ...)

# Creates a GradScaler once at the beginning of training.
scaler = GradScaler()

for epoch in epochs:
    for input, target in data:
        optimizer.zero_grad()

        # Runs the forward pass with autocasting.
        with autocast():
            output = model(input)
            loss = loss_fn(output, target)

        # Scales loss.  Calls backward() on scaled loss to create scaled gradients.
        # Backward passes under autocast are not recommended.
        # Backward ops run in the same dtype autocast chose for corresponding forward ops.
        scaler.scale(loss).backward()

        # scaler.step() first unscales the gradients of the optimizer's assigned params.
        # If these gradients do not contain infs or NaNs, optimizer.step() is then called,
        # otherwise, optimizer.step() is skipped.
        scaler.step(optimizer)

        # Updates the scale for next iteration.
        scaler.update()
{% endhighlight %}