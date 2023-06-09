---
title: Biases in Recommender Systems
tags: [bias, recsys]
category: ML
layout: post
---


<!--more-->

본 포스트는 [Towards Data Science](https://towardsdatascience.com/biases-in-recommender-systems-top-challenges-and-recent-breakthroughs-edcda59d30bf)에 기고된 글을 요약하였습니다.

## 들어가며

<center>
	<figure>
		<img src="https://files.realpython.com/media/Build-a-Recommendation-Engine-With-Collaborative-Filtering_Watermarked.451abc4ecb9f.jpg" alt="TITLE" style="zoom:50%;" loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://realpython.com/build-recommendation-engine-collaborative-filtering/">here</a></figcaption>
	</figure>
</center>

추천 시스템은 오늘날 여러 플랫폼에서 사용하는 성공적인 ML 서비스입니다. 추천 시스템은 사용자가 새로운 콘텐츠나 제품을 발견하는 데 큰 도움을 줍니다. 하지만 다양한 형태의 **편향**으로 인해 잘못된 추천을 제공할 수도 있고, 이에 따라 사용자 경험을 저하시킬 수 있습니다. 그래서 최근 추천 시스템에 관한 주요한 연구 주제 중 하나가 이 편향을 제거하는 방법입니다.

본 포스트에서는 추천 시스템에서 발생할 수 있는 편향을 크게 다섯 가지로 분류하여 다룹니다. 그리고 여러 기업에서 이 편향을 어떻게 해결하고 있는지도 간략히 소개하고자 합니다.

## 편향의 종류

### 1. 클릭베이트 편향 (Clickbait Bias)

<center>
	<figure>
		<img src="https://b1821216.smushcdn.com/1821216/wp-content/uploads/2018/08/Clickbait-Fake-News.jpg?lossy=1&strip=1&webp=1" alt="TITLE" style="zoom:50%;" loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://cariadmarketing.com/insights/clickbait-what-is-it/">here</a></figcaption>
	</figure>
</center>

**클릭베이트(Clickbait)** 는 클릭을 유도하기 위한 낚시 콘텐츠를 의미합니다. 유튜브를 예시로 들자면 소위 말하는 어그로를 끄는 썸네일 정도 되겠네요. 사용자의 클릭을 유도해야 하는 플랫폼에는 항상 클릭베이트가 존재합니다.

그러다 보니 일반적인 랭킹 모델에서 단순히 클릭을 positive feedback으로 간주한다면 모델은 매우 쉽게 클릭베이트에 편향됩니다. 만약 이를 고려하지 않고 모델을 학습한다면 사용자에게 클릭베이트 콘텐츠를 더 많이 추천하게 되고, 이런 문제는 계속해서 커져가게 됩니다.

클릭베이트 편향을 줄일 방법은 [Covington et al, (2016)](https://otzslayer.github.io/ml/2022/01/25/deep-neural-networks-for-youtube-recommendations.html)에서 제안한 바 있습니다. 이 논문에서는 **weighted logistic regression**을 사용하여 문제를 해결하는데요. 학습 데이터에서 positive training examples (클릭이 있는 노출)에 가중치를 부여하고 반대의 경우(클릭이 없는 노출)에 대해서는 낮은 가중치를 부여합니다. 수학적으로 이런 weighted logistic regression 모델은 대략적인 비디오 시청 시간에 대한 예측값의 확률을 학습합니다. 실제 서빙할 때는 예상 시청 시간에 따라 동영상의 순위를 매기고, 예상 시청 시간이 긴 콘텐츠를 추천 상단에 노출시킵니다.

### 2. 재생 시간 편향 (Duration Bias)

<center>
	<figure>
		<img src="https://piunikaweb.com/wp-content/uploads/2021/03/YouTube-progress-bar.png"  loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://piunikaweb.com/2021/04/01/some-youtube-users-say-progress-bar-now-appears-in-yellow-like-in-ads/">here</a></figcaption>
	</figure>
</center>

위에서 다룬 weighted logistic regression은 클릭베이트 편향에선 좋은 성과를 보입니다만 이제부터 다룰 재생 시간 편향에는 큰 효과를 보이지 않습니다. **재생 시간 편향**이란 동영상이 길수록 어쩔 수 없이 오래 시청하게 되는데, 이런 긴 시청 시간이 사용자의 기호를 반영한 것이 아니라 실제 콘텐츠의 시간이 길기 때문에 발생하는 문제를 말합니다.

간단하게 10초짜리 영상과 두 시간짜리 영상이 있다고 가정해 보죠. 이 두 영상을 10초간 시청했다면 어떤 영상에 더 관심을 두고 있는걸까요? 잘 모르겠지만 적어도 두 시간짜리 영상은 아닐 것 같습니다. 

이런 문제는 [Zhan et al (2022)](https://dl.acm.org/doi/abs/10.1145/3534678.3539092)에서 제안하는 방법으로 해결할 수 있습니다. 이 연구에서는 **Quantile-based watch-time prediction**을 제안하는데요. 이름에서 알 수 있듯이 모든 콘텐츠의 영상 길이를 분위수로 환산하고 시청 시간도 분위수로 환산합니다. 

아까처럼 10초짜리 영상과 두 시간짜리 영상이 있을 때 두 시간짜리 영상은 총 시간이 길기 때문에 10의 분위수를 가질 것입니다. 그런데 이 영상을 10초 봤다면 그 분위수는 매우 작은 수가 됩니다. 반대로 10초짜리 영상은 영상 길이의 분위수가 1이지만 10초를 모두 봤기 때문에 그 분위수가 10이 됩니다. 

```
영상 시간 = 120분 -> 영상 분위수 10
시청 시간 =  10초 -> 시청 분위수 1

영상 시간 =  10초 -> 영상 분위수 1
시청 시간 =  10초 -> 시청 분위수 10
```

학습 시에는 이처럼 영상 분위수를 제공하고 시청 시간 분위수를 예측하도록 합니다. 서빙할 때는 시청 시간 분위수에 순위를 매겨서 결과를 제공하고요. 논문에서 제시한 A/B 테스트 결과 weighted logistic regression에 비해서 총 시청 시간이 0.5% 증가하였고, 시청 시간을 직접 예측할 때보다 시청 시간이 0.75% 증가했다고 합니다.

### 3. 순위 편향 (Position Bias)

<center>
	<figure>
		<img src="https://poetsandquants.com/wp-content/uploads/sites/5/2013/12/rankings.jpg" alt="TITLE" style="zoom:50%;" loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://poetsandquants.com/2014/03/06/top-10-secure-in-new-u-s-news-ranking/">here</a></figcaption>
	</figure>
</center>

**순위 편향**은 가장 높은 순위에 있는 항목이 실제로 사용자가 가장 좋아하는 콘텐츠여서가 아니라, 단순히 순위가 높아 가장 많은 클릭을 유도하는 콘텐츠지만 사용자가 표시되는 순위를 맹목적으로 믿는 현상을 의미합니다. 우리는 사용자가 원하는 것을 예측해야 하는데 반대로 사용자가 모델을 믿어버리는 거죠. 이런 내용은 [Google의 ML 엔지니어링 권장 사항](https://developers.google.com/machine-learning/guides/rules-of-ml#rule_36_avoid_feedback_loops_with_positional_features)에서도 다루고 있습니다.

이 편향을 해결하기 위한 방법은 여러 가지가 있습니다.

- Rank randomization
- Intervention harvesting ([Argawal et al (2018)](https://arxiv.org/pdf/1812.05161.pdf))
- 순위를 피처로 사용하기 ([참고](https://towardsdatascience.com/machine-learning-does-not-only-predict-the-future-it-actively-creates-it-1615895c80a9))

순위 편향의 가장 큰 문제는 모델이 항상 실제보다 좋아 보일 수 있다는 점입니다. 하지만 실제 사용자의 니즈를 충족시키지 못하기 때문에 모델의 품질은 점점 낮아지게 됩니다. 그러나 사용자가 이탈하기 전까지는 이 문제를 확인하기 어렵습니다. 따라서 항상 사용자의 리텐션과 추천 다양성을 정량화하는 지표를 포함하여 모니터링해야 합니다.

### 4. 대중 편향 (Popularity Bias)

<center>
	<figure>
		<img src="https://hellopartner.com/content/images/size/w1200/wp-content/uploads/2021/01/Picky-influencers-header.jpg" alt="TITLE" style="zoom:50%;" loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://hellopartner.com/2021/02/01/2021-the-year-to-get-picky-about-which-influencers-you-work-with/">here</a></figcaption>
	</figure>
</center>

**대중 편향**이란 특정 사용자의 기호와 상관 없이 사용자가 많이 액세스한 콘텐츠란 이유로 해당 콘텐츠가 높은 순위로 노출되는 경향을 말합니다. 대중 편향은 실제로 제가 최근 사내 시스템을 위해 개발한 추천 알고리즘에서도 잠재적인 문제로 남아있습니다. 해당 시스템의 도메인 특성상 사용자가 많이 액세스하는 콘텐츠가 있고, 그뿐만 아니라 사용자가 실제로 액세스해야 하죠. 하지만 여기에 너무 많은 사용자의 데이터가 몰려 있다 보니 대중 편향이 발생하게 됩니다. 이런 경우 사용자에게 맞는걸 인기 있는 콘텐츠가 무시당할 수 있습니다.

이에 대해 [Yi et al (2019)](https://research.google/pubs/pub48840/)에서 대중 편향을 해결하는 방법을 제안하였습니다. 모델 학습에 사용하는 logistic regression에서 콘텐츠에 대한 logit 값을 **정규화(normalization)** 하는 방법인데요.
-  `logit(u, v) <- logit(u, v) - log(P(v))`
	- `logit(u, v)` : 콘텐츠 `v`를 액세스하는 사용자 `u`에 대한 로짓 함수
	- `log(P(v))` : 콘텐츠 `v`에 대한 log-frequency

실제로 이렇게 했을 때 온라인 A/B 테스트에서 전체 사용자 참여도가 0.37% 향상되었다고 합니다.

### 5. 단일 관심 편향 (Single-interest Bias)

<center>
	<figure>
		<img src="https://www.childrensomaha.org/wp-content/uploads/2021/04/Picture1-1.jpg" alt="TITLE" style="zoom:50%;" loading="lazy"/>
	<figcaption style="text-align: center;">Image from <a href="https://www.childrensomaha.org/10-tips-to-deal-with-picky-eaters/">here</a></figcaption>
	</figure>
</center>

사용자가 어떤 카테고리를 매우 좋아하고 다른 카테고리에 대한 관심이 조금 있다고 할 때, 모델이 사용자가 다양한 관심사, 선호도를 갖고 있다는 사실을 이해하지 못하는 경향을 **단일 관심 편향**이라고 합니다.

이런 문제를 해결하려면 랭킹 모델 결과에 약간의 후보정을 하면 됩니다. 사용자가 드라마 카테고리를 80%, 나머지 카테고리를 20% 본다고 하면 실제 모델에서 드라마를 80% 추천해 주도록 하는 방식이죠. 

[Harald Steck (2018)](https://dl.acm.org/doi/10.1145/3240323.3240372)에서는 이런 방법을 **Platt scaling**이라고 불렀는데요. 실제로 넷플릭스 추천에 대해서 후보정을 한 결과, 추천도 다양해지고 전반적인 시청 시간도 개선되었다고 합니다.

## 나가며

여기까지 다양한 편향에 대해서 알아보았습니다. 실제로 추천 시스템을 개발하다 보면 다양한 문제를 접하게 됩니다. 위에서 다룬 편향들은 물론이고, 정말 알 수 없는 기호를 보이는 사용자들도 많이 보게 되죠. 추천 시스템이 재밌는 점이 바로 여기에 있다고 생각합니다. 종잡을 수 없는 선호도를 가진 다양한 사용자에게 그에 맞는 추천을 제공하여  고객의 만족을 끌어낼 수 있으니까요.