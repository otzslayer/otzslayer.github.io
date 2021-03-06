---
title: "Model Stacking"
author: "Jaeyoon Han"
date: "2016-12-30"
output: html_document
layout: post
image: /assets/article_images/2016-12-28-model-stacking/title.jpg
categories: machine-learning
---





## Guide to Model Stacking (Meta Ensembling)

Kaggle에서 Competition을 참여할 때마다 독학의 한계를 뼈저리게 느꼈는데, 특히 앙상블 기법을 구현하고자 할 때 더욱 심하게 느꼈다. 중요한 기법임에도 불구하고 적절한 튜토리얼이나 관련 내용이 나와 있는 서적을 찾기 힘들었기 때문이다. 그 덕분에 하나의 모델을 최대한 튜닝해서 사용하는 버릇이 생겼었는데 이 방법으론 항상 한계에 부딪혔다. 그러던 도중 괜찮은 포스팅을 찾았고, 공부 겸 공유를 위해 해당 포스팅을 번역해서 올리기로 했다. [원문 포스트](https://gormanalysis.com/guide-to-model-stacking-i-e-meta-ensembling/)

---

#### Introduction

Stacking (Meta ensembliing 이라고도 한다.)은 여러 개의 예측 모델에서 얻은 정보들을 결합하여 새로운 모델을 생성하는 모델 앙상블 기법이다. 종종 스택 모델(stacked model, 2nd-level model)은 자연스럽게 평활화(smoothing)[^1] 되고 각각의 베이스 모델들에 대해서 성능이 좋게 나오는 부분과 성능이 좋지 않은 부분을 하이라이트 하는 능력이 있어서 기존 베이스 모델들에 비해 좋은 성능을 보인다. 이런 이유에서 stacking은 베이스 모델들의 결과가 현저하게 다를 때 가장 좋은 효율을 보인다. 그래서 간단한 예제와 더불어 실제로 stacking을 어떻게 활용하는지에 대한 가이드를 준비했다.

본 아티클에 사용된 코드는 [이 곳](https://github.com/ben519/MLPB/tree/master/Problems/Classify%20Dart%20Throwers)에서 받을 수 있다.


#### Motivation

네 명의 사람들이 보드에 모두 합쳐 187개의 다트를 던졌다고 가정해보자. 이 중에서 150개의 다트는 누가 던졌고 어디에 던졌는지 알고 있다. 나머지는 누가 던졌는지는 모르지만, 어디에 던졌는지는 알고 있다. 이제 우리가 할 작업은 나머지 37개의 다트를 누가 던졌는지 맞추는 것이다.



<img src="/assets/article_images/2016-12-28-model-stacking/unnamed-chunk-2-1.png" title="plot of chunk unnamed-chunk-2" alt="plot of chunk unnamed-chunk-2" width="576" style="display: block; margin: auto;" />

#### K-Nearest Neighbors (Base Model 1)

이제 k-NN을 이용해서 이 분류 문제를 풀어보도록 하자. 5-fold Cross-Validation을 수행하여 가장 적절한 $k$ 값을 $K = (1, 2, \cdots, 30)$ 에서 찾는다.

{% highlight r linenos %}
    1. 트레이닝 데이터를 다섯 개의 똑같은 사이즈의 fold로 나눈다. 이들을 test folds라고 하자.
    2. k = 1, 2, ..., 10 에 대해서
        2.1 각각의 test fold에 대해서
            2.1.1 나머지 네 개의 test fold를 합쳐서 training fold로 사용한다.
            2.1.2 현재 k 값을 사용하여 training fold에 kNN 모델을 적합시킨다.
            2.1.3 test fold에 대한 예측값을 생성하여 정확도로 평가한다.
        2.2 총 다섯 개 fold 예측값의 정확도의 평균을 계산한다.
    3. 가장 좋은 평균 CV 정확도를 보이는 k 값을 선택한다.
{% endhighlight %} 


<img src="/assets/article_images/2016-12-28-model-stacking/unnamed-chunk-4-1.png" title="plot of chunk unnamed-chunk-4" alt="plot of chunk unnamed-chunk-4" width="576" style="display: block; margin: auto;" />

가상의 데이터에 대해서, CV 성능이 가장 좋게 나오는 경우는 $k = 1$ (67% 정확도)였다. 이제 $k = 1$을 사용하여 전체 트레이닝 데이터를 학습하고, 테스트 데이터에 대해 예측값을 생성한다. 결국 이 모델은 대략 70% 정도의 분류 정확도를 보여줄 것이다.


#### Support Vector Machine (Base Model 2)

이번엔 서포트 벡터 머신을 이용해서 위 분류 문제를 해결해보자. 추가적으로, 데이터를 선형적으로 분류하는 것을 돕기 위해서 각각의 다트가 보드 중앙에서 얼마나 떨어져 있는지를 측정한 변수인 `DistFromCenter`를 추가하도록 하자. R에서 `LiblineaR` 패키지를 이용하여 두 개의 하이퍼파라미터(hyper-parameter)를 튜닝하도록 하자.

**type** 

1. L2-regularized L2-loss support vector classification (dual)
2. L2-regularized L2-loss support vector classification (primal)
3. L2-regularized L1-loss support vector classification (dual)
4. support vector classification by Crammer and Singer
5. L1-regularized L2-loss support vector classification

**cost**

파라미터들의 조합은 위의 다섯 개의 타입과 비용값 (.01, .1, 1, 10, 100, 1000, 2000)의 카르테시안 곱(cartesian product)로 나타낸다. 즉 아래 표와 같다.

| type | cost |
|:----:|:----:|
|   1  | 0.01 |
|   1  |  0.1 |
|   1  |   1  |
|  ... |  ... |
|   5  |  100 |
|   5  | 1000 |
|   5  | 2000 |

kNN에서 사용했던 CV + Grid search를 활용하여, `type = 4`, `cost = 1000`이라는 최적의 파라미터를 얻었다. 다시 이 파라미터들을 사용하여 전체 트레이닝 데이터셋으로 모델을 구축하고, 테스트 데이터셋으로 예측값을 생성한다. CV 정확도의 경우 61% 정도였으며, 실제 테스트셋에 대한 정확도는 78% 정도였다.



<img src="/assets/article_images/2016-12-28-model-stacking/unnamed-chunk-6-1.png" title="plot of chunk unnamed-chunk-6" alt="plot of chunk unnamed-chunk-6" width="576" style="display: block; margin: auto;" />


#### Stacking (Meta Ensembling)

<figure>
  <center>
  <img src="https://gormanalysis.com/wp-content/uploads/2016/12/base-model-train-class-regions.png" width="600px">
</center>
</figure>

당연하게도, XVM은 Bob이 던진 다트와 Sue가 던진 다트를 굉장히 잘 분류하였지만, Kate와 Mark가 던진 다트들은 잘 분류하지 못했다. kNN에서는 이와 정반대의 양상이 나타난다. (*HINT*: 이런 양상의 모델들을 stacking하면 굉장히 효율적이다.)

Stacking을 실제로 구현하는 방법은 여러 가지가 있지만, 본 아티클에서는 본인이 가장 좋아하는 방법을 사용하고자 한다.

1. 트레이닝 데이터를 다섯 개의 test fold로 나눈다.

    `train`

    |  ID | FoldID | XCoord | YCoord | DistFromCenter | Competitor |
    |:---:|:------:|:------:|:------:|:--------------:|:----------:|
    |  1  |    5   |   0.7  |  0.05  |      0.71      |     Sue    |
    |  2  |    2   |  -0.4  |  -0.64 |      0.76      |     Bob    |
    |  3  |    4   |  -0.14 |  0.82  |      0.83      |     Sue    |
    | ... |   ...  |   ...  |   ...  |       ...      |     ...    |
    | 183 |    2   |  -0.21 |  -0.61 |      0.64      |    Kate    |
    | 186 |    1   |  -0.86 |  -0.17 |      0.87      |    Kate    |
    | 187 |    2   |  -0.73 |  0.08  |      0.73      |     Sue    |

2. 트레이닝 데이터와 같은 row ID와 fold id를 가지는 데이터에 비어있는 칼럼 `M1`, `M2`를 추가시킨 `train_meta`라는 데이터셋을 만든다. 똑같은 방법으로 `test_meta`도 만들어준다.

    `train_meta`

    |  ID | FoldID | XCoord | YCoord | DistFromCenter | M1  | M2  | Competitor |
    |:---:|:------:|:------:|:------:|:--------------:|-----|-----|:----------:|
    |  1  |    5   |   0.7  |  0.05  |      0.71      | NA  | NA  |     Sue    |
    |  2  |    2   |  -0.4  |  -0.64 |      0.76      | NA  | NA  |     Bob    |
    |  3  |    4   |  -0.14 |  0.82  |      0.83      | NA  | NA  |     Sue    |
    | ... |   ...  |   ...  |   ...  |       ...      | ... | ... |     ...    |
    | 183 |    2   |  -0.21 |  -0.61 |      0.64      | NA  | NA  |    Kate    |
    | 186 |    1   |  -0.86 |  -0.17 |      0.87      | NA  | NA  |    Kate    |
    | 187 |    2   |  -0.73 |  0.08  |      0.73      | NA  | NA  |     Sue    |
    
    `test_meta`
    
    |  ID | XCoord | YCoord | DistFromCenter |  M1 |  M2 | Competitor |
    |:---:|:------:|:------:|:--------------:|:---:|:---:|:----------:|
    |  6  |  0.06  |  0.36  |      0.36      |  NA |  NA |    Mark    |
    |  12 |  -0.77 |  -0.26 |      0.81      |  NA |  NA |     Sue    |
    |  22 |  0.18  |  -0.54 |      0.57      |  NA |  NA |    Mark    |
    | ... |   ...  |   ...  |       ...      | ... | ... |     ...    |
    | 178 |  0.01  |  0.83  |      0.83      |  NA |  NA |     Sue    |
    | 184 |  0.58  |   0.2  |      0.62      |  NA |  NA |     Sue    |
    | 185 |  0.11  |  -0.45 |      0.46      |  NA |  NA |    Mark    |

3. 각각의 test fold {Fold1, Fold2, ..., Fold5}에 대해서
3.1 다른 네 개의 fold를 합쳐서 training fold를 생성한다.
3.2 각각의 베이스 모델에 대해서
    - M1: kNN (k = 1)
    - M2: 서포트 벡터 머신 (type = 4, cost = 1000)
    
    3.2.1 Training fold에 베이스 모델을 적합시키고 test fold를 이용해 예측값을 얻어낸다. 이 예측값들은 `train_meta`에 저장을 하는데, 각각의 베이스 모델을 `M1`, `M2`에 넣으면 된다.

    fold1을 이용해 `M1`과 `M2`를 채워넣은 `train_meta`

    |  ID | FoldID | XCoord | YCoord | DistFromCenter | M1  | M2  | Competitor |
    |:---:|:------:|:------:|:------:|:--------------:|-----|-----|:----------:|
    |  1  |    5   |   0.7  |  0.05  |      0.71      | NA  | NA  |     Sue    |
    |  2  |    2   |  -0.4  |  -0.64 |      0.76      | NA  | NA  |     Bob    |
    |  3  |    4   |  -0.14 |  0.82  |      0.83      | NA  | NA  |     Sue    |
    | ... |   ...  |   ...  |   ...  |       ...      | ... | ... |     ...    |
    | 183 |    2   |  -0.21 |  -0.61 |      0.64      | NA  | NA  |    Kate    |
    | 186 |    1   |  -0.86 |  -0.17 |      0.87      | Bob | Bob |    Kate    |
    | 187 |    2   |  -0.73 |  0.08  |      0.73      | NA  | NA  |     Sue    |

4. 전체 트레이닝 데이터를 각 베이스 모델에 적합시키고, 테스트 데이터셋을 이용해서 예측값을 생성한다. 이 예측값들은 `test_meta`의 `M1`, `M2` 칼럼에 저장한다.

    `test_meta`
    
    |  ID | XCoord | YCoord | DistFromCenter |   M1  |   M2  | Competitor |
    |:---:|:------:|:------:|:--------------:|:-----:|:-----:|:----------:|
    |  6  |  0.06  |  0.36  |      0.36      |  Mark |  Mark |    Mark    |
    |  12 |  -0.77 |  -0.26 |      0.81      |  Kate |  Sue  |     Sue    |
    |  22 |  0.18  |  -0.54 |      0.57      |  Mark |  Sue  |    Mark    |
    | ... |   ...  |   ...  |       ...      | ...   | ...   |     ...    |
    | 178 |  0.01  |  0.83  |      0.83      |  Sue  |  Sue  |     Sue    |
    | 184 |  0.58  |   0.2  |      0.62      |  Sue  |  Mark |     Sue    |
    | 185 |  0.11  |  -0.45 |      0.46      |  Mark |  Mark |    Mark    |

5. `train_meta` 데이터를 이용해 새로운 모델 $\mathcal{S}$ (the stacking model)에 적합시킨다. 이 때 `M1`과 `M2` 칼럼은 피쳐로 활용한다. 선택적으로 기존 트레이닝 데이터셋이나 엔지니어링한 피쳐를 추가시킬 수 있다. 여기서 모델 $\mathcal{S}$는 `LiblineaR` 패키지에서 `type = 6`, `cost = 100`의 파라미터를 사용한 Logistic Regression을 사용한다.

6. 스택 모델 $\mathcal{S}$을 이용해서 최종적으로 `test_meta` 데이터의 예측값을 얻어낸다.

    $\mathcal{S}$를 이용해서 생성한 `test_meta`
    
    |  ID | XCoord | YCoord | DistFromCenter |  M1  |  M2  | Pred | Competitor |
    |:---:|:------:|:------:|:--------------:|:----:|:----:|:----:|:----------:|
    |  6  |  0.06  |  0.36  |      0.36      | Mark | Mark | Mark |    Mark    |
    |  12 |  -0.77 |  -0.26 |      0.81      | Kate |  Sue |  Sue |     Sue    |
    |  22 |  0.18  |  -0.54 |      0.57      | Mark |  Sue | Mark |    Mark    |
    | ... |   ...  |   ...  |       ...      |  ... |  ... |  ... |     ...    |
    | 178 |  0.01  |  0.83  |      0.83      |  Sue |  Sue |  Sue |     Sue    |
    | 184 |  0.58  |   0.2  |      0.62      |  Sue | Mark |  Sue |     Sue    |
    | 185 |  0.11  |  -0.45 |      0.46      | Mark | Mark | Mark |    Mark    |

이 과정의 메인 포인트는 각각의 베이스 모델의 **예측값**을 스택 모델의 **피쳐**(meta feature)로 사용한다는 점이다. 스택 모델은 각각의 모델이 어디에서 좋은 성능을 내는지, 나쁜 성능을 내는지 인식할 수 있다. 알아두어야 할 것은 `train_meta` 데이터의 메타 피쳐(meta feature)들은 그 행의 타겟값과 **종속적이지 않다**는 점이다. 베이스 모델을 적합시킬 때 타겟값의 정보 없이 메타 피쳐를 생성하기 때문이다.

다른 방법도 있는데, 각각의 test fold로 얻은 베이스 모델을 사용해서 바로 테스트 데이터셋으로 예측값을 얻어낼 수 있다. 이렇게 한다면 다섯 개의 kNN 모델과 다섯 개의 SVM 모델을 활용해서 테스트셋 예측값을 얻어내는 것과 같다. 이 방법의 경우 위 접근법보다는 소요 시간이 적다는 장점이 있다. 각 모델에 대해서 다시 학습하지 않아도 되기 때문이다. 또한 트레이닝 데이터의 메타 피쳐와 테스트 데이터의 메타 피쳐가 유사한 분포를 가지게 할 수 있다. 하지만 첫 번째 접근법을 이용하면 테스트 데이터의 메타 피쳐들 `M1`, `M2`의 정확도가 더 높게 나온다. 각각의 베이스 모델들은 전체 트레이닝 데이터셋을 이용하여 학습되었기 때문이다.

kNN의 예측 정확도는 71.3%, SVM의 예측 정확도는 81.1%, 스택 모델의 예측 정확도의 경우 86.5%이다.

#### Stacked Model Hyper Parameter Tuning

그런데, 스택 모델의 하이퍼파라미터들을 어떻게 튜닝해야 할까? 베이스 모델들에 대해서는 우리가 항상 해왔듯이 Cross-validation과 Grid search를 이용해서 파라미터를 튜닝할 수 있다. 이 방법들은 우리가 어떤 fold를 사용했는지 전혀 상관은 없지만, 보통 스태킹(stacking)을 위해 같은 fold를 사용하는 것이 편리하다. 실제로는 대부분의 사람들이 정확히 같은 CV fold를 이용해서 CV와 Grid search를 수행하고, 이것으로 메타 피쳐들을 추출한다. 사실 이 접근법에는 조금의 문제가 있다.

(추후 추가)


[^1]: 거친 표본 추출이나 노이즈 때문에 데이터에 좋지 않은 미세한 변동이나 불연속성 등이 있을 때, 이런 변동이나 불연속성을 약하게 하거나 제거하여 매끄럽게 만들어주는 일련의 프로세스를 말한다. Laplace smoothing, Interpolation 등의 기법이 있다.
