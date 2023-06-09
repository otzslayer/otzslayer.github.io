---
title: Kubeflow for ML - Chapter 3
tags: [kubeflow, mlops]
category: Kubeflow
layout: post
---

Chapter 3: Kubeflow Design: Beyond the Basics

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

## Introduction

본 장에서는 Kubeflow의 컴포넌트들을 살펴보게 됩니다. 아래 Figure 3-1은 Kubeflow의 아키텍처를 보여줍니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/kubeflow-architecture.png" alt="Kubeflow architecture" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-1. Kubeflow architecture</figcaption>
  </figure>
</center>

## Getting Around the Central Dashboard

Kubeflow의 메인 인터페이스는 센트럴 대시보드(central dashboard)입니다. 사용자는 이 페이지를 통해 대부분의 Kubeflow 컴포넌트에 접근할 수 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/central-dashboard.png" alt="Central dashboard" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-2. The central dashboard</figcaption>
  </figure>
</center>


### Notebooks (JupyterHub)

Kubeflow에서는 Notebook 환경으로 JuypterHub를 제공합니다. 단일 사용자의 Jupyter Notebook을 여러 인스턴스에 대해 생성, 관리, 프록시하는 다중 사용자용 허브인데요. JupyterHub에서 접근하기 위해서는 왼쪽 사이드 메뉴에서 Notebooks를 클릭하면 됩니다. 새로운 서버를 생성할 때 Docker 이미지, 서버 자원 등을 설정할 수 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/notebook-settings.png" alt="Notebook settings" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">JupyterHub in Kubeflow</figcaption>
  </figure>
</center>

Kubeflow는 데이터 사이언티스트가 노트북 환경을 벗어나지 않은 채로 클러스터와 관련된 작업을 수행할 수 있도록 노트북 이미지에 `kubectl`을 포함하였습니다. 그래서 Jupyter Notebook의 아무 셀에서 `!kubectl get pod -A` 를 실행하면 현재 Kubernetes의 Pod 목록을 확인할 수 있습니다.

Jupyter notebook Pod은 `default-editor`라는 특수한 서비스 계정으로 실행되고 있습니다. 이 계정은 Pods, Deployments, Services, Jobs, TFJobs, PyTorchJobs와 같은 다양한 Kubernetes 권한을 갖고 있습니다. 이 계정을 사용자 정의 역할 (custom role)에 바인딩하여 노트북 서버의 권한을 제한하거나 확장할 수 있습니다. 

### Training Operators

JupyterHub만으로 프로덕션 환경에서의 학습은 쉽지 않기 때문에 Kubeflow에서는 다음과 같은 학습 컴포넌트를 제공하고 있습니다.

-   Chainer
-   MPI
-   Apache MXNet
-   PyTorch
-   TensorFlow

Kubeflow에서는 오퍼레이터(operator)라는 application-specific 컨트롤러로 분산 학습 작업을 관리합니다. 이 오퍼레이터는 Kubernetes API로 확장하여 리소스 상태를 생성, 관리, 조작합니다. 더 나아가서 오퍼레이터를 통해 확장성, 관찰 가능성(observability), 페일오버(failover)와 같은 중요한 배포 컨셉들을 자동화할 수 있습니다. 또한 파이프라인에서 시스템 내 다른 구성 요소의 실행들을 연결하는 데 사용할 수 있습니다.

### Kubeflow Pipelines

Kubeflow Pipelines은 머신러닝 애플리케이션 실행을 오케스트레이트합니다. Argo Workflows 기반으로 구현되어 있으며, 따라서 Kubeflow는 Argo 컴포넌트들을 설치하게 됩니다. 큰 틀에서 파이프라인 실행에는 다음 컴포넌트를 포함합니다.

-   Python SDK
-   DSL Compiler
-   Pipeline Service
-   Kubernetes resources
    -   파이프라인 서비스는 Kubernetes API를 호출하여 파이프라인을 실행하는 데 필요한 Kubernetes **CRD (사용자 정의 리소스 정의, Custom Resource Definitions)**를 생성합니다.
-   Orchestration controllers
    -   오케스트레이션 컨트롤러들은 CRD에서 지정한 파이프라인 실행을 완료에 필요한 컨테이너를 실행합니다. 컨테이너들은 가상 머신의 Kubernetes Pod 내에서 실행됩니다.
-   Artifact storage
    -   Metadata
        -   실험, 작업, 실행, 메트릭 등으로 메타데이터는 MySQL에 저장됩니다.
    -   Artifacts
        -   파이프라인 패키지, 뷰, 시계열과 같은 대규모 메트릭 등으로 Kubeflow Pipelines은 이런 아티팩트들을 MinIO server, GCS, Amazon S4와 같은 아티팩트 스토어에 저장합니다.

### Hyperparameter Tuning

Kubeflow는 Katib 같은 컴포넌트를 통해 Kubernetes 클러스터 위에서 하이퍼파라미터 튜닝을 수행하도록 지원합니다.  Katib은 Bayesian Optimization 기반의 하이퍼파라미터 튜닝 프레임워크로 TensorFlow, MXNet, PyTorch 등에 대한 튜닝을 지원합니다. Katib은 다음 네 가지 주요 컨셉을 기반에 두고 있습니다.

-   Experiment
    -   Feasible space에서 실행하는 하나의 최적화 작업을 말합니다. 실험 중에는 목적 함수 $f(x)$가 바뀌지 않는 것을 가정합니다.
-   Trial
    -   파라미터 값의 목록입니다. 하나의 Trial이 끝나면 목적 함수 $f(x)$에 대한 계산값이 나오게 됩니다.
-   Job
-   Suggestion
    -   파라미터 집합을 구축하는 알고리즘을 의미합니다. Katib은 현재 Random, Grid, Hyperband, Bayesian Optimization을 지원합니다.

### Model Inference

Kubeflow는 ML 모델을 운영 환경에 맞춰 확장해 배포할 수 있게 합니다. TFServing, Seldon Serving, PyTorch Serving, TensorRT 같은 모델 서빙 프레임워크를 제공할 뿐만 아니라 자동 확장, 네트워킹, 헬스 체킹, 서버 구성에 대한 모델 추론 문제를 일반화하는 KFServing까지 제공합니다. 전체적인 구현은 Istio와 Knative Serving을 기반에 두고 있습니다.

기본적으로 모델 서빙은 까다롭기 때문에 빠른 스케일업과 스케일다운이 중요합니다. Knative serving은 새로운 요청을 자동으로 최신 모델 배포로 라우팅하여 지속적인 모델 업데이트를 지원합니다. 이를 위해서는 이후 롤백을 위해 사용하지 않는 모델을 계속 유지하되 리소스 활용을 최소화해야 합니다. Knative는 클라우드 네이티브익 때문에 기본 인프라 스택의 이점을 활용해 Kubernetes에 있는 로깅, 트레이싱, 모니터링 등의 기능을 제공합니다. KFServing 또한 Knative eventing을 사용해 플러그형 이벤트 소스를 선택적으로 지원합니다.

KFServing 배포는 다음의 컴포넌트들을 연결하는 일종의 오케스트레이터 역할을 합니다.

-   Preprocessor
    -   선택적 컴포넌트로 모델 서빙에 필요한 형태로 입력 데이터를 변환하는 역할
-   Predictor
    -   필수적인 컴포넌트로 실제 모델 서빙하는 역할
-   Postprocessor
    -   선택적 컴포넌트로 모델 서빙 결과를 출력에 맞는 형태로 변환하는 역할

### Metadata

모델 생성에 대한 정보를 추적하고 캡처하는 메타데이터 관리 기능은 Kubeflow에서 중요한 컴포넌트 중 하나입니다. 메타데이터 컴포넌트에는 다음 정보를 등록할 수 있습니다.

-   모델 생성에 사용된 데이터 소스
-   파이프라인의 컴포넌트나 각 단계를 통해 생성된 아티팩트
-   컴포넌트나 각 단계의 실행 결과
-   파이프라인과 관련된 연결 정보

이처럼 ML 메타데이터는 ML 워크플로우 내 컴포넌트와 각 단계의 인풋과 아웃풋을 추적합니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/ml-metadata.png" alt="Metadata diagram" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-3. Metadata diagram</figcaption>
  </figure>
</center>

## Support Components

### MinIO

파이프라인 아키텍처의 기반은 공유 저장소입니다. 요즘은 클라우드 제공 업체마다 별도의 스토리지를 제공하는데요. 이로 인해 의존성 문제가 발생할 수 있습니다. Kubeflow는 이런 의존성 무제를 최소화하기 위해 대규모 프라이빗 클라우드 인프라용으로 설계된 고성능 분산 객체 저장소인 MinIO를 제공합니다. 물론 프라이빗 클라우드 뿐만 아니라 퍼블릭 APPI에 대한 일관적인 게이트웨이 역할도 수행 가능합니다.

MinIO는 다양한 방법으로 설정할 수 있습니다. Kubeflow에서 제공하는 기본값은 단일 컨테이너 모드인데 이는 설정을 통해 분산화할 수 있습니다. 또한 유연한 게이트웨이 옵션을 제공하여 규모 제한 없이 클라우드에 독립적인 구현을 가능케 합니다.

MinIO에 접근하기 위해서는 다음 명령어를 통해 포트포워딩하여 `https://localhost:9000`으로 접속할 수 있습니다. (HTTPS 리다이렉션이 안된다면 `http://localhost:9000`으로 접속해야 합니다.) 기본 아이디와 비밀번호는 `minio/minio123` 입니다.

```bash
kubectl port-forward --address=0.0.0.0 -n kubeflow svc/minio-service 9000:9000
```

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/minio-dashboard.png" alt="MinIO dashboard" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-4. MinIO dashboard</figcaption>
  </figure>
</center>

여기에 MinIO CLI를 설치하여 워크스테이션에서 MinIO에 대한 여러 가지 작업을 수행할 수 있습니다. 제 경우에는 Linuxbrew를 설치해놓아서 간단하게 설치할 수 있었습니다.

```bash
brew install minio/stable/minio
```

설치가 완료되면 MinIO 클라이언트가 Kubeflow MinIO에 연결되도록 합니다.

```bash
mc config host add minio http://localhost:9000 minio minio123
```

이제 만약 새로운 버켓을 만든다면 다음의 명령어를 실행하면 됩니다.

```bash
mc mb minio/kf-book-examples
```

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/create-bucket-minio.png" alt="Create bucket in MinIO" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Create a bucket in MinIO</figcaption>
  </figure>
</center>

### Istio

Kubeflow를 지원하는 또 다른 컴포넌트는 **Istio**입니다. Istio는 다음 기능들을 제공하는 일종의 서비스 메시 (service mesh)입니다.

-   서비스 디스커버리 (Service discovery)
    -   서비스가 오토 스케일링 등의 이유로 동적으로 생성되거나 컨테이너 기반으로 배포됨에 따라 서비스의 IP가 동적으로 변경되는 경우가 많은데, 서비스 클라이언트가 서비스를 호출할 때 서비스의 위치를 알아내는 기능 [[출처]](https://bcho.tistory.com/1252)
-   로드 밸런싱 (Load balancing)
-   장애 복구 (Failure Recovery)
-   메트릭 (Metrics)
-   모니터링 (Monitoring)
-   속도 제한 (Rate limiting)
-   접근 제어 (Access control)
-   엔드투엔드 인증 (End-to-end authentication)

Istio는 논리적으로 데이터 영역 (data plane)과 컨트롤 영역 (control plane)으로 분리되어 있습니다.

-   데이터 영역 (Data plane) : 트래픽을 전송하는 목적을 제공하는 영역으로 컨트롤 영역에 의해 통제됩니다.
-   컨트롤 영역 (Control plane) : 데이터 영역을 제어하는 영역입니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/istio-architecture.png" alt="Istio architecture" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-5. Istio architecture</figcaption>
  </figure>
</center>

Istio의 주요 컴포넌트는 다음과 같습니다.

-   Envoy
    -   Istio의 데이터 영역은 장애 처리 (failure handling), 동적 서비스 디스커버리, 로드 밸런싱 등의 기능을 제공하는 Envoy proxy에 기반을 두고 있습니다. Envoy는 다음의 기능들을 탑재하고 있습니다.
        -   동적 서비스 디스커버리
        -   로드 밸런싱
        -   TLS 터미네이션 (TLS termination)
        -   HTTP/2, gRPC 프록시
        -   서킷 브레이커 (Circuit breaker)
        -   헬스 체크 (Health checks)
        -   퍼센트 기반의 트래픽 분할을 통한 단계적 롤아웃 (Staged rollouts with percent-based traffic splitting)
        -   결함 주입 (Fault injection)
        -   다양한 메트릭
-   Mixer
    -   서비스 메시 전반에 걸쳐 접근 제어 및 사용 정책을 적용하고 Envoy 프록시와 기타 서비스로부터 텔레메트리(telemetry) 데이터를 수집합니다.
-   Pilot
    -   Pilot은 지능형 라우팅 (intelligent routing)과 복원성 (resiliency)을 위한 Envoy 사이드카와 트래픽 관리 기능에 대해 서비스 디스커버리를 제공합니다.
-   Galley
    -   Galley는 Istio의 구성에 대한 유효성 검사, 수집, 처리, 배포를 위한 컴포넌트입니다. Kubernetes의 YAML 파일을 Istio가 이해할 수 있는 형태로 변환하는 작업을 수행합니다.
-   Citadel
    -   Citadel은 강력한 서비스-투-서비스와 엔드 유저 인증을 가능하게 합니다.

### Knative

<center>
  <figure>
    <img src="/assets/images/2022-06-19-kubeflow-chapter3/knative-architecture.png" alt="Knative Architecture" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Figure 3-6. Knative architecture</figcaption>
  </figure>
</center>

Knative에서 가장 중요한 요소는 Knative Serving입니다. Knative Serving은 서버리스(serverless) 애플리케이션의 배포와 서비스를 지원하는데요. Knative Serving은 Kubernetes CRD의 집합으로 구현이 되어 있습니다.

-   Service
-   Route
-   Configuration
-   Revision

### Apache Spark

Kubeflow 1.0 부터 Spark 잡을 실행할 수 있는 Spark operator를 내장하고 있습니다. 추가로 Google의 Dataproc과 Amazon의 Elastic Map Reduce (EMR)과의 통합도 지원합니다. 

### Kubeflow Multiuser Isolation

최신 버전의 Kubeflow는 다중 사용자 격리(multiuser isolation)을 도입하여 다른 팀이나 사용자와 같은 리소스 풀을 공유할 수 있도록 합니다. 이를 통해 사용자는 서로의 리소스를 실수로 참조하거나 변경하지 않고도 자신의 리소스를 격리하여 보호할 수 있습니다. 1.0 버전부터는 Kubeflow의 Jupyter notebook 서비스가 다중 사용자 격리를 완전히 지원하는 첫 번째 애플리케이션이 되었습니다.