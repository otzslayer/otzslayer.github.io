---
title: "Boruta Algorithm"
author: "Jaeyoon Han"
date: "2017-01-12"
output: html_document
layout: post
image: /assets/article_images/2017-01-12-boruta-algorithm/title.jpg
categories: machine-learning
---





## Feature Selection with the Boruta Package (Kursa, M. and Rudnicki, W., 2010)

### 1. Introduction

-	변수 선택의 중요성
	-	많은 머신러닝 알고리즘들은 최적의 변수보다 많은 수의 변수를 사용하면 예측 정확도가 감소한다는 사실이 알려져있다 (Kohavi and John, 1997).
	-	*최소-최적 문제 (minimal-optimal problem)* (Nilsson *et al.*, 2007)
		-	실용적인 관점에서 가능한 최고의 분류 결과를 출력하는 작은 피쳐 집합을 고르는 것은 마땅하다.
	-	*다중 연관 문제 (all-relevant problem)*
		-	몇몇 상황에서 분류와 관련 있는 모든 변수들을 찾아내는 것 역시 중요하다. (Nilsson et al., 2007)
		-	다중 연관 문제는 최소-최적 문제보다 더 어렵다.
			-	피쳐 집합에서 피쳐를 제거해서 분류 정확도가 내려갔다는 사실로 피쳐의 중요성은 이야기할 수 있지만, 해당 피쳐가 중요하지 않다고 선언하기에는 정확도의 감소로는 아직 불충분하다.
			-	주어진 피쳐와 예측값 사이의 직접적인 상관관계의 부재가 해당 피쳐가 다른 피쳐들과 연관이 없다는 가정에 대한 증명이 될 수 없기 때문에, 필터링 기법을 사용할 수 없다.
			-	필터링보다 더 많은 계산이 요구되는 래퍼(wrapper) 알고리즘의 제한이 있다.

### 2. Boruta algorithm

-	Boruta 알고리즘은 R에서 랜덤 포레스트를 구현한 `randomForest` 패키지의 래퍼다.
-	피쳐의 중요성은 임의의 피쳐 순열로 인해 발생하는 분류 정확도의 손실로 계산한다.

	-	분류에 사용된 랜덤 포레스트 내의 모든 트리들 각각에 대해서 계산된다.
	-	이에 따라 각 변수에 대한 정확도 손실의 평균과 표준편차가 계산된다.
		-	랜덤 포레스트 알고리즘에서는 평균과 표준 편차를 이용한 $Z$ score를 활용하지 않는다. 분포가 $N(0, 1)$을 따르지 않으므로 피쳐의 중요성에 대한 통계적 유의성과 직접적인 관련이 없기 때문이다.
		-	반면에 Boruta 알고리즘은 랜덤 포레스트 내의 트리에서 평균 정확도 손실의 출렁임(fluctuation)을 고려하기 위해서 중요성을 측정할 때 $Z$ score를 사용한다.

-	Boruta 알고리즘의 동작 과정
    1.  모든 피쳐들을 복사해서 새로운 칼럼을 생성한다.
    2.  복사한 피쳐들 (섀도우 피쳐) 각각을 따로 섞는다.
    3.  섀도우 피쳐들에 대해서 랜덤 포레스트를 실행하고, Z score를 얻는다.
    4.  얻은 Z score 중에서 최댓값인 MSZA를 찾는다. (MSZA, Max Z-score among shadow attributes)
    5.  기존 피쳐들에 대해서 랜덤 포레스트를 실행하여 Z score를 얻는다.
    6.  각각의 기존 피쳐들에 대해서 Z-score > MSZA 인 경우 히트 수를 올린다.
    7.  Z-score <= MSZA인 경우, MSZA에 대해서 two-side equality test를 수행한다.
    8.  통계적으로 유의한 수준에서 Z-score < MSZA인 경우, 해당 피쳐를 중요하지 않은 피쳐로 드랍한다.
    9.  통계적으로 유의한 수준에서 Z-score > MSZA인 경우, 해당 피쳐를 중요한 변수로 둔다.
    10. 모든 피쳐들의 중요성이 결정되거나 최대 반복 회수에 도달할 때까지 Step 5부터 반복한다.

-	Boruta 알고리즘의 시간 복잡도는 $O(P \cdot N)$이다.

	-	$P$ : 피쳐의 개수
	-	$N$ : 데이터의 행
