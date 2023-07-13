---
created: 2023-07-13
title: Apple Sillicon (M1, M2)에 Kubeflow 설치하기
layout: post
tags: [kubeflow, apple-sillicon, minikube, docker, kubernetes]
category: MLOps
image:
  path: https://i.imgur.com/MwNRWQh.png
  alt: Kubeflow
---

## 들어가며

Kubeflow는 보통 퍼블릭 클라우드 환경에 설치해서 쓰게 됩니다. 아무래도 쿠버네티스를 활용하고 로컬에 설치하기 어렵기 때문인데요. 그래도 로컬 리눅스 환경에서는 설치가 크게 어렵지 않습니다. 심지어 윈도우에서 WSL에도 Kubeflow를 설치하는 것은 순서만 잘 따라가면 쉽습니다. [[참고]](https://otzslayer.github.io/kubeflow/2022/05/29/install-kubeflow-on-wsl.html) Mac도 Intel Mac이라면 어렵지 않게 설치가 가능합니다.

문제는 ARM 환경에서의 설치입니다. M1, M2 Mac은 ARM 프로세서를 사용하기 때문에 AMD64 환경만 지원하는 Kubeflow의 대부분 Pod들을 설치할 수 없습니다. 과거에 M1이 나오고 얼마 되지 않은 시기에 설치를 시도했다가 절대 해결되지 않는 문제 때문에 포기를 했었습니다. 이는 Apple Sillicon만의 문제가 아니라 모든 ARM 프로세서에서 발생하는 문제입니다.

본 포스트는 위에서 언급한 문제를 모두 해결한 설치 방법을 자세하게 제공합니다. 실제 설치 후 올바르게 작동하는 것도 확인을 마쳤습니다.

## 필요한 것들

필요한 툴은 사실 [공식 문서](https://github.com/kubeflow/manifests#prerequisites)에 모두 나와있습니다. 다음은 Kubeflow 레파지토리에서 제공하는 사전에 준비해야 할 것들입니다.

- 1.25버전 이하의 `Kubernetes`
- `kustomize` 5.0.0
	- 과거 Kubeflow는 `kustomize` 개발 여부와 상관 없이 3.2.0 버전을 사용하도록 했습니다. 하지만 현재는 저장소 내 `example/kustomization.yaml` 에서 `sortOption` 필드를 사용하고 있기 때문에 반드시 5.0.0 버전을 사용해야 합니다.
- `kubectl`

다음은 쿠버네티스 환경 사용을 위해 필요한 툴입니다.

- `minikube`
- `Docker`


### Docker

![](https://i.imgur.com/yDNJBMz.png){: w="800"}

Docker는 [공식 홈페이지](https://docs.docker.com/desktop/install/mac-install/)에서 Apple Sillicon 버전을 다운로드할 수 있습니다.

### kustomize

`kustomize` 5.0.0 버전을 설치합니다. 다음 명령어를 순차적으로 터미널에 입력하면 됩니다.

```bash
$ wget https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv5.0.0/kustomize_v5.0.0_darwin_arm64.tar.gz
$ tar -zxvf kustomize_v5.0.0_darwin_arm64.tar.gz
$ chmod +x kustomize
$ sudo mv kustomize /usr/local/bin
$ kustomize version
v5.0.0
```

### minikube

minikube는 [Homebrew](https://brew.sh/index_ko)를 이용해서 간단하게 설치할 수 있습니다.

```bash
$ brew install minikube
```

## Kubeflow 설치

글을 작성하는 2023년 7월 13일 기준으로 최신 버전인 Kubeflow 1.7을 설치합니다. 최신 버전이어야 하는 이유는 Istio 등 일부 Pod들이 ARM을 지원하기 때문입니다.

```bash
git clone https://github.com/kubeflow/manifests.git --branch v1.7.0
cd manifests
```

### 일부 Pod의 Pull 경로 수정

> 이 부분이 매우 중요합니다!
{:.prompt-tip}

처음 Kubeflow 설치를 시도했을 때 마지막에 일부 Pod이 계속 `ImagePullBackOff` 상태에서 바뀌지 않는 것을 확인했습니다. `kubectl describe` 로 확인해보니 ARM 버전의 이미지가 없어서 생기는 문제였습니다. 그러다 우연히 아래 링크를 발견했는데요.

[https://github.com/hwang9u/manifests/commit/7008414a59ddb251d79ba2f16a87c5acf7d83d12](https://github.com/hwang9u/manifests/commit/7008414a59ddb251d79ba2f16a87c5acf7d83d12)

인도 분으로 추정되는 분이 ARM 버전이 없는 이미지를 모두 ARM 버전으로 포팅해서 올려놓으셨습니다. 위 커밋에 있는 것처럼 모든 변경 사항을 적용하면 문제가 없이 설치가 됩니다. 조금 귀찮지만 하나하나 변경해주시기 바랍니다.

## Kubeflow 설치

### minikube 설치

다음 명령어를 이용하여 minikube를 통해 Kubernetes를 띄웁니다.

```bash
minikube start --driver=docker --kubernetes-version=1.24.1 --disk-size 20g --memory 10240 --cpus 4 --profile kubeflow
```

이때 적당히 큰 메모리를 잡아주어야 특정 Pod에서 `OOMKilled` 오류가 나는 것을 방지할 수 있습니다. 그리고 Kubernetes 버전은 1.24.1 을 사용했습니다. 더 높은 버전에서는 종종 오류가 발생하여 1.24.1을 사용하고 있습니다.

### Kubeflow 설치

Kubeflow 설치는 한 줄의 명렁어로 가능한데요. 조금 복잡한 명령어를 사용해야 합니다.

```bash
while ! kustomize build example | awk '!/well-defined/' | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done
```

Kubeflow에서 사용하는 모든 Pod이 한 번에 설치되는 일은 거의 없습니다. 동시에 여러 개를 설치하다보니 설치 중 오류가 발생하는 경우가 있기 때문입니다. 이런 문제를 방지하기 위해서 무한 반복을 통해 모두 설치될 때까지 전체 설치를 수행합니다. 제 경우엔 전체 설치에 5분 정도 걸렸던 것 같습니다.

### 설치 확인

```bash
kubectl get pods --all-namespaces
```

위 명령어를 통해서 모든 Pod이 `Running` 상태로 바뀌길 기다려야 합니다. 최초 기동 시에는 약 30분 가량 걸렸습니다. 올바르게 `Running` 상태가 된 이후에는 재기동 시 금방 올바르게 Pod이 뜨게 됩니다.

![](https://i.imgur.com/3yOWk9d.png){: w="700"}
_모든 Pod의 STATUS가 Running이 되어야 합니다!_

### Kubeflow UI 접속

포트포워딩을 통해 로컬호스트로 접근할 수 있습니다.

```bash
kubectl port-forward svc/istio-ingressgateway -n istio-system 8080:80
```

위 명령어를 실행하고 `http://localhost:8080` 으로 접속하면 됩니다.

![](https://i.imgur.com/0Fi9GTv.png){: w="800"}
_Kubeflow 설치 완료 !_

## 레퍼런스

- [https://github.com/hwang9u/manifests/commit/7008414a59ddb251d79ba2f16a87c5acf7d83d12](https://github.com/hwang9u/manifests/commit/7008414a59ddb251d79ba2f16a87c5acf7d83d12)
- [https://yangoos57.github.io/blog/mlops/kubeflow/installation_guide/](https://yangoos57.github.io/blog/mlops/kubeflow/installation_guide/)
	- **현재 이 방법으론 설치가 불가능합니다. 참고하세요!**
- [https://github.com/kubeflow/manifests/issues/2416](https://github.com/kubeflow/manifests/issues/2416)
