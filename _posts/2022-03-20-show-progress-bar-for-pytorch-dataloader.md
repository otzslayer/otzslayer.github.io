---
title: PyTorch DataLoader에서 Progress Bar 나타내기
tags: [pytorch, dataloader, tqdm]
category: PyTorch
layout: post
---


<!--more-->

## 문제

PyTorch를 사용하여 한 번의 epoch에 대해 학습을 진행할 때 `DataLoader` 객체를 순회하게 됩니다.
그 때 `tqdm`을 이용하여 progress bar를 표시하는 경우가 있는데 간혹 제대로 표시가 안되는 경우가 있습니다.
아래 코드를 보겠습니다.
아래 코드는 `tqdm` 이슈란을 살펴보다가 가져오게 되었습니다. [[Ref]](https://github.com/tqdm/tqdm/issues/1261)

```python
for i_batch, feed_dict in tqdm.tqdm(enumerate(dataloader)):
    sleep(0.01)
```

## 해결

굉장히 일반적인 방법인데 이렇게 `tqdm`으로 `enumerate`를 감싸는 경우 progress bar가 올바르게 표시가 안됩니다.
시간과 초당 반복 횟수만 표시가 됩니다.
Progress bar를 제대로 표시하려면 `tqdm`과 `enumerate`를 사용하는 순서를 바꾸면 됩니다.

```python
for i_batch, feed_dict in enumerate(tqdm.tqdm(dataloader)):
    sleep(0.01)
```

해당 이슈 게시물을 보면 `tqdm`의 문제가 아니고 단순히 `enumerate`의 기능상 특징 때문이라고 합니다.
`DataLoader` 객체의 경우 `__len__()`가 있지만 `enumerate`는 `__len__()`을 갖지 않기 때문에 `enumerate`를 `tqdm`으로 감싸게 되면 전체 길이에 대한 정보가 없어 progress bar를 표시하지 못하게 됩니다.

## 더 나아가서

이런 문제는 `zip()`을 사용할 때도 비슷합니다. 
`zip()` 역시 `__len__()`이 없기 때문에 `tqdm`을 이용해서 progress bar를 표시하려면 `tqdm`을 먼저 사용한 다음 `zip()`으로 감싸줘야 합니다.

```python
for e1, e2 in zip(tqdm.tqdm(iter1), iter2):
    ...
```
