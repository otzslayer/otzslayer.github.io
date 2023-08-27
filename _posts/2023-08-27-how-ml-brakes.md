---
created: 2023-08-27
title: How ML Breaks
layout: post
tags: [mlops, troubleshooting]
category: MLOps
image:
  path: https://i.imgur.com/5miI4qj.png
  alt: 
---

본 포스트는 [How ML Breaks: A Decade of Outages for One Large ML Pipeline](https://www.usenix.org/conference/opml20/presentation/papasian)의 내용을 요약/정리한 내용을 담고 있습니다.

---

## 발표자 정보
- Daniel Papasian
	- 2023년 기준 13+년차 ML 시스템 엔지니어
- Todd Underwood
	- 2023년 기준 14+년차 ML 시스템 엔지니어
	- Google ML SRE 리드
	- [Reliable Machine Learning](https://www.oreilly.com/library/view/reliable-machine-learning/9781098106218/) 책 저자

## Motivation

### ML이 중요해지려면 작동하는 것이 우선

- 학습이 완료되지 않았거나 잘못된 데이터 등을 대상으로 학습하는 모델은 배포할 수 없음
- 파이프라인, 특히 지속적으로 또는 주기적으로 재학습하는 파이프라인을 운영하는 사람들은 이런 일이 흔히 발생하는 것을 잘 알고 있음

### 장애는 장애를 이해하는 가장 좋은 방법

- 장애 발생은 선물임. 장애는 어떤 것에 문제가 발생했는지, 왜 발생했는지에 대한 자연스러운 실험 단계임
- 이런 장애들을 종합하면 어떤 장애가 가장 흔한지 알 수 있음
- 장애를 이해하는 것은 이런 장애를 회피하고 완화하고 해결하는데에 도움을 줌

### 가정

- 대부분의 ML 시스템 장애는 실제로 ML 장애가 아님
- 지루하고 흔하게 발생하는 장애는 눈에 띄기 어렵고 심각하게 받아들이기 어려움 (제멜바이스와 손 씻기)

## Background/Methodology

### 데이터셋

- 구글은 회사 초창기부터 작성한 대부분의 포스트모템(postmortems)에 대한 데이터베이스를 보유하고 있음
- 시스템에서 가장 큰 두 가지 구성 요소의 이름을 포함해 장애를 검색함
- 지난 10년간 모두 96개의 포스트모템을 찾을 수 있었음
- 포스트모템 메타데이터에는 근본 원인 분석과 영향 수준이 포함되어 있음
	- 이러한 메타데이터는 19개의 카테고리로 분류함

### 방법론

- 모든 문제를 19개의 카테고리로 나누었음
	- 가장 많이 나온 카테고리는 96개의 장애 중 15개를 포함하고 있음
	- 가장 적은 카테고리는 하나를 포함하고 있음
- 모든 카테고리는 다음의 두 축을 따라 다시 그룹화하여 5점 척도로 순위를 매김
	- ML vs. ML이 아닌 것
	- 분산 시스템 vs. 단일 시스템
- 카테고리 분류는 순전히 장애 원인에 대한 설명에 근거하여 이루어짐

## Failure Taxonomy

### ML vs. Not-ML

#### ML
- 데이터 분포의 변경
- 학습 데이터의 선정 및 처리 문제: 잘못된 샘플링, 동일한 데이터의 발생, 데이터 건너뛰기 등
- 하이퍼파라미터
- 임베딩 표현의 미스매치
- 라벨링되지 않은 데이터에 대한 학습

#### Not ML
- 의존성 오류(데이터 제외)
- 배포 오류(순서, 잘못된 타겟, 잘못된 바이너리 등)
- CPU 장애
- 효율적이지 못한 데이터 구조

### Distributed vs. Not

#### Distributed

- 시스템 오케스트레이션
- 두 시스템간 데이터 조인 오류 (예. 외래키 누락)
- CPU와 같은 일부 자원이 충분하지 않은 경우
- 안전하지 않은 순서로 푸시된 변경 사항

#### Less Distributed

- CPU 이상 현상 (확률적으로만 분산됨 - 대규모 시스템에서만 발생)
- 운영 환경에 적용하기 전 테스트되지 않은 변경 사항

#### Not Distributed
- Assertion 에러
- 안좋은 데이터 구조

## Results

![](https://i.imgur.com/bTGBIRP.png){: w="600"}

- 대부분의 장애와 그 원인은 ML이 아님

![](https://i.imgur.com/Hjlt06d.png){: w="600"}
- 대부분의 장애는 분산 시스템의 요소로 설명할 수 있음