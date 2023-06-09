---
title: Dataset Shift에 대하여 (2)
tags: [dataset-shift, concept-drift]
category: ML
aside:
  toc: true
show_category: true
layout: post
---

Concept Drift는 무엇이고, Concept Drift 문제를 예방하는 법은 무엇일까요? 🤔

<!--more-->

<figure>
  <img src='/assets/images/2021-11-23-about-dataset-shift-2/drift.jpg'>
  <figcaption style="text-align: center;">Image from <a href="https://pixabay.com/photos/drift-car-race-speed-smoke-3723673/">Pixabay</a></figcaption>
</figure>


[1부](/ml/2021/11/19/about-dataset-shift-1.html)에 이어서 2부에서는 Concept Shift에 대한 내용을 다룹니다.

## Concept Shift

> *Concept shift happnes when the relationship between the input and class variables change, which presents the hardest challenge among the different types of Dataset Shift that have been tackled so far. —  [Herrera, Francisco. "Dataset shift in classification: Approaches and problems." International work-conference on artificial neural networks (IWANN). 2011.](http://iwann.ugr.es/2011/pdf/InvitedTalk-FHerrera-IWANN11.pdf)*
> 

Concept Drift라고 부르기도 하는 Concept Shift는 이미 다룬 두 가지의 Dataset Shift하고는 성질이 조금 다릅니다. 입력 피처의 분포 변화는 없지만 입력 피처와 레이블과의 관계가 변화한 경우입니다. 

$$P_{tr}(Y \mid X) \neq P_{ts}(Y \mid X) \quad \text{and} \quad P_{tr}(X) = P_{ts}(X) \quad \text{in} \quad X \to Y \\
P_{tr}(X \mid Y) \neq P_{ts}(X \mid Y) \quad \text{and} \quad P_{tr}(Y) = P_{ts}(Y) \quad \text{in} \quad Y \to X $$

Concept Shift는 시간의 흐름에 의존적인 데이터에서 많이 발생합니다. 가령 주식 시장 예측과 관련된 데이터에서도 자주 발생하는 현상이고 최근 COVID-19로 인한 사회 전반적인 변화로 인해 많이 발생하는 Dataset Shift의 한 종류이기도 합니다. Concept Shift는 어떤 형태로 발생하는가에 따라 세부적인 분류가 가능합니다. 점진적으로 변화했는지, 갑작스럽게 변화했는지, 변화가 반복되는지에 따라서 말이죠.

### Gradual Concept Drift

<figure>
  <img src='/assets/images/2021-11-23-about-dataset-shift-2/gradual_concept_drift.jpeg'>
  <figcaption style="text-align: center;">Image from [1]</figcaption>
</figure>

Gradual Concept Drift 또는 Incremental Concept Drift라고 부르는 이 현상은 시간이 지남에 따라 점진적으로 발생하는 Concept Drift 입니다. 긴 시간을 두고 발생하는 경우가 많으며 굉장히 자연스레 발생하는 현상입니다. 

가장 쉽게 생각할 수 있는 예는 경제적 변화입니다. 시장과 관련된 시계열 예측을 한다고 했을 때 금리 인상, 인플레이션 같은 이벤트들은 제법 긴 시간을 두고 꾸준히 영향을 미치게 됩니다.

### Sudden Concept Drift

<figure>
  <img src='/assets/images/2021-11-23-about-dataset-shift-2/sudden_concept_drift.jpeg'>
  <figcaption style="text-align: center;">Image from [1]</figcaption>
</figure>

Sudden Concept Drift는 문자 그대로 갑자기 발생하는 Concept Drift입니다. COVID-19로 인해 락다운이 발생하여 전 사회에 큰 변화를 가져오는 경우처럼 짧은 기간 내에 갑작스레 발생하는 Concept Drift라고 보시면 됩니다. 일반적으로 외부 요인으로 인해 많이 발생하게 됩니다.

교통량 예측과 같은 문제에서도 가끔 발생하는 현상이기도 합니다. 새로운 도로가 생기거나 기존 도로에 공사가 발생하여 폐쇄되는 경우 등 갑작스러운 변화가 생겨 기존의 데이터로 학습을 할 수 없는 상황이 발생하기도 합니다.

### Recurrent Concept Drift

<figure>
  <img src='/assets/images/2021-11-23-about-dataset-shift-2/recurrent_concept_drift.jpeg'>
  <figcaption style="text-align: center;">Image from [1]</figcaption>
</figure>

Recurrent Concept Drift는 주기적으로 발생하는 Concept Drift 입니다. 이 Concept Drift는 계절성(Seasonality)와 비슷합니다. 계절성은 일반적인 시계열 문제에서도 자주 보이고, 그에 대한 대처도 어렵지 않기 때문에 Recurrent Concept Drift는 큰 문제가 되진 않습니다. 다만 학습 데이터에서 발생하지 않은 계절성이 테스트 데이터나 운영 중에 발생하는 경우엔 문제가 될 수 있습니다.

### How to Prevent Concept Drift?

Concept Shift를 방지하거나 해결하는 방법은 다양합니다. [Neptune의 기술 블로그 아티클](https://neptune.ai/blog/concept-drift-best-practices)에서는 다음의 다섯 가지 방법을 제시하고 있습니다. 덧붙여 Dataset Shift에 대해서도 활용 가능한 방법이라고 생각합니다.

- 온라인 학습 (Online learning)
    - 일반적으로 프로덕션 레벨의 모델에 작은 묶음 단위의 데이터인 미니배치(Mini-batch) 데이터를 주입해 학습하는 방식입니다.
        - 스트리밍 데이터에 대해 학습/배포 되는 실제 애플리케이션들은 대부분 온라인 학습을 하고 있습니다.
    - 빠른 변화에 강건한 모델을 위해 자주 사용되는 학습 방법으로 Concept Drift를 방지하기에 가장 좋은 방법 중 하나입니다.
- 주기적인 재학습 (Periodically re-train)
    - 모델의 성능 하락이 미리 정해놓은 임계값(Threshold)을 넘을 때마다 재학습하는 방식입니다.
- 대표 서브샘플에 대한 주기적 재학습 (Periodically re-train on a representative subsample)
    - Concept Drift가 감지된 후 Instance Selection 같은 방법을 통해 모집단을 대표할 수 있고, 기존 데이터 분포와 동일한 확률 분포를 가지는 서브샘플을 추출합니다.
    - 그 후 전문가의 도움을 받아 데이터 포인트를 다시 레이블링하여 이 데이터로 모델을 학습합니다.
- 모델 가중치를 통한 앙상블 학습 (Ensemble learning with model weighting)
    - 여러 모델의 결과를 가중 평균 등을 통해 앙상블하는 것도 하나의 방법입니다.
- 피처 제거 (Feature dropping)
    - 한 번에 하나의 피처로 여러 모델을 만들고 충분한 성능이 나오지 않는 피처들을 제거하는 방식으로 Concept Drift를 대응할 수 있습니다.

## References

[1] Jayawardena, N. (Jun 27, 2021). Data Drift — Part 1: Types of Data Drift. https://towardsdatascience.com/data-drift-part-1-types-of-data-drift-16b3eb175006

[2] Das, S. (Nov 8, 2021). Best Practices for Dealing With Concept Drift. https://neptune.ai/blog/concept-drift-best-practices