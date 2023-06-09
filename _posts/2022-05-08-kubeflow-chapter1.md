---
title: Kubeflow for ML - Chapter 1
tags: [kubeflow, mlops]
category: Kubeflow
layout: post
---

Chapter 1: Kubeflow, What It Is and Who It Is For

<!--more-->


>   👀 본 포스트는 [Kubeflow for Machine Learning](https://oreilly.com/library/view/kubeflow-for-machine/9781492050117/) 책을 발췌/요약하면서 필요한 내용은 추가하여 작성하였습니다.
>
>   -   [Chapter 1: Kubeflow: What It is and Who It Is For](/kubeflow/2022/05/08/kubeflow-chapter1.html)
>   -   [Chapter 2: Hello Kubeflow](/kubeflow/2022/05/15/kubeflow-chapter2.html)
>   -   [Chapter 3: Kubeflow Design: Beyond the Basics](/kubeflow/2022/06/19/kubeflow-chapter3.html)
>   -   [Chapter 4: Kubeflow Pipelines](/kubeflow/2022/07/10/kubeflow-chapter4.html)
>   -   Chapter 5: Data and Feature Preparation
>   -   Chapter 6: Artifact and Metadata Store
>   -   Chapter 7: Training a Machine Learning Model
>   -   Chapter 8: Model Inference
>   -   Chapter 9: Case Study Using Multiple Tools
>   -   Chapter 10: Hyperparameter Tuning And Automated Machine Learning

<center>
  <figure>
    <img src="/assets/images/2022-05-08-kubeflow-chapter1/kubeflow.png" alt="Example" style="zoom:10%;" loading="lazy" />
    <figcaption style="text-align: center;">Kubeflow</figcaption>
  </figure>
</center>

Kubeflow는 데이터 사이언티스트가 학습한 모델을 제품화하거나 데이터 엔지니어가 모델을 확장 가능하고 신뢰할 수 있게 만드는 것을 가능하게 합니다. Kubeflow가 하는 일은 Kubernetes 위에서 작동하는 여러 도구, 특히 오픈 소스들을 사용할 수 있도록 하는 것입니다.

## Model Development Life Cycle

모델 개발 생명 주기(Model Development Life Cycle, MDLC)는 모델 학습과 모델 추론 사이의 흐름 또는 과정을 의미합니다. Figure 1-1은 모델 학습과 추론 사이에서 일어나는 연속적인 상호작용을 잘 보여줍니다.

<center>
  <figure>
    <img src="/assets/images/2022-05-08-kubeflow-chapter1/figure1-1.png" alt="Example" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Figure 1-1. Model development life cycle</figcaption>
  </figure>
</center>

## Where Does Kubeflow Fit In?

Kubeflow는 MDLC의 모든 단계를 위한 클라우드 네이티브 도구들의 모음이라고 생각하면 됩니다. 그리고 각각의 도구들을 심리스(seamless) 하게 사용할 수 있게 해줍니다. 가장 중요한 특징은 Kubeflow가 사용자가 MDLC의 각 컴포넌트(component)를 통합된 엔드투엔드(end-to-end) 파이프라인으로 빌드할 수 있게 해준다는 점입니다. 이때 Kubeflow는 컨테이너화와 확장성(scalability), 그리고 파이프라인의 이식성(portability)과 재현성(repeatability)을 위해 Kubernetes를 활용합니다.

여기서 MDLC는 다음의 단계를 포함하고 있습니다.

-   데이터 탐색 (Data Exploration)
-   피처 준비 (Feature Preparation)
-   모델 학습/튜닝 (Model Training/Tuning)
-   모델 서빙 (Model Serving)
-   모델 테스팅 (Model Testing)
-   모델 버저닝 (Model Versioning)

## Why Containerize? Why Kubernetes?

<center>
  <figure>
    <img src="/assets/images/2022-05-08-kubeflow-chapter1/containerization.jpeg" alt="Example" style="zoom:75%;" loading="lazy" />
    <figcaption style="text-align: center;">Difference between virtual machines and containers</figcaption>
  </figure>
</center>


컨테이너를 통한 격리 환경은 머신러닝 단계를 이식할 수 있고 재현할 수 있게 해줍니다. 쉽게 말해서 컨테이너화하면 "이건 내 컴퓨터에서는 됐었는데 여기선 안되네?" 같은 상황을 줄일 수 있죠. 따라서 우리가 만든 파이프라인을 특정 클라우드에 얽매이지 않고 사용할 수 있게 됩니다. Google Cloud에서든 Amazon AWS에서든 사용할 수 있게 되는 겁니다.

컨테이너에 대한 개념을 익히기에는 [subicura님의 쿠버네티스 안내서](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html)만한 것이 없다고 봅니다. 자세한 내용은 해당 글을 참고하시기 바랍니다. :smiley:

## Kubeflow's Design and Core Components

Kubeflow는 위에서 언급한 것처럼 ML 실무자가 본인이 원하는 대로 자체 스택을 구성하고 커스터마이즈할 수 있습니다. 또한 Kubeflow는 **결합성 (composability), 이식성 (portability), 확장성 (scalability)**을 통해 ML 시스템을 개발하고 배포하는 프로세스를 단순화하도록 설계되었습니다.

-   결합성
    -   Kubeflow의 핵심 컴포넌트는 이미 ML 실무자들이 자주 사용하는 것들입니다. Kubeflow는 이 도구들을 ML 각 단계에 독립적으로 사용하거나 엔드 투 엔드 파이프라인으로 구성하는 것을 도와줍니다.
-   이식성
    -   컨테이너 기반의 디자인과 Kubernetes, 클라우드 네이티브 아키텍쳐의 장점을 통해 Kubeflow는 사용자에게 특정한 개발 환경을 요구하지 않도록 합니다. 사용자는 본인의 환경에서 실험하고 프로토타이핑한 다음, 프로덕션 환경에 쉽게 배포할 수 있습니다.
-   확장성
    -   Kubernetes를 사용하기 때문에 Kubeflow는 클러스터의 요구에 따라 동적으로 시스템을 확장할 수 있습니다.
    -   특히 확장성은 데이터가 계속 많아지는 환경에서 큰 도움이 됩니다.

참고로 2021년 5월 구글에서 발간한 백서인 [Practitioners guide to MLOps](https://services.google.com/fh/files/misc/practitioners_guide_to_mlops_whitepaper.pdf) 에서는 MLOps의 핵심 요소들을 다음과 같이 정의합니다.

<center>
  <figure>
    <img src="/assets/images/2022-05-08-kubeflow-chapter1/mlops_tech_caps.png" alt="Example" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Core MLOps Technical Capabilities</figcaption>
  </figure>
</center>


다음은 Kubeflow의 컴포넌트들입니다.

-   Data Exploraation with Notebooks
    -   데이터 탐색은 MDLC의 시작점으로 보통 Jupyter Notebook을 이용합니다.
-   Data/Feature Preparation
    -   ML 모델을 만들 때 가장 중요한 부분 중 하나로 데이터를 효과적으로 추출하고 변환하고 불러오는 작업을 포함합니다.
    -   Kubeflow에서는 Apache Spark와 TensorFlow Transform을 지원합니다. Apache Spark는 대규모의 데이터를 작업할 때 용이하며, TensorFlow Transform은 TensorFlow Serving과의 통합을 통해 추론 작업을 쉽게 할 수 있습니다.
-   Training
    -   Kubeflow에서는 다음의 프레임워크를 지원합니다.
        -   TensorFlow
        -   PyTorch
        -   Apache MXNet
        -   XGBoost
        -   Chainer
        -   Caffe2
        -   Message passing interface (MPI)
-   Hyperparameter Tuning
    -   Katib이 있습니다. Katib은 AutoML을 위한 Kubernetes-native 프로젝트입니다. 하이퍼파라미터 튜닝과 얼리 스타핑 (Early stopping), 뉴럴 아키텍처 서치 (Neural Architecture Search, NAS)를 지원합니다.
-   Model Validation
-   Inference/Prediction
    -   Kubeflow는 KFServing 같은 서빙을 위한 멀티프레임워크 컴포넌트를 지원하며, 추가로 TensorFlow Serving, Seldon Core, BentoML 같은 기존 서빙 툴도 지원합니다.
-   Pipelines
    -   위의 컴포넌트는 모두 MDLC의 각 단계에 대응하는 컴포넌트이며, Kubeflow는 MDLC를 ML 파이프라인으로 취급하여 각 노드가 ML 워크플로의 단계인 그래프로 구현합니다.
    -   Kubeflow 파이프라인은 사용자가 재사용 가능한 워크플로우를 쉽게 구성할 수 있도록 하는 컴포넌트입니다.

<center>
	<figure>
		<img src="/assets/images/2022-05-08-kubeflow-chapter1/kubeflow_pipeline.png" alt="Example" style="zoom:100%;" loading="lazy" />
		<figcaption style="text-align: center;">Figure 1-3. A Kubeflow pipeline</figcaption>
	</figure>
</center>

