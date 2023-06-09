---
title: WSL에서 Kubeflow 설치하기
tags: [wsl, kubeflow, mlops, setting-environment]
category: Kubeflow
layout: post
---


<!--more-->

## Introduction

최근 Kubeflow 최신 버전을 설치하는 포스트를 올렸었는데, 제가 가지고 있는 M1 Mac에서는 설치가 불가능했습니다. 아무래도 Kubeflow는 클라우드 환경에 대한 설치에 대한 내용을 공식 문서에서 제공하고 있기 때문에 ARM64인 M1 Mac에서 왜 설치가 되지 않는지 알기 어려웠습니다. 어찌저찌 Kubeflow를 구성하는 컴포넌트들에 대한 이슈를 마구잡이로 찾아보다가 **Istio는 ARM64를 지원하지 않는다**는 글을 보게 되었습니다. 결국 이러나저러나 Kubeflow를 설치했을 때 구동되는 Pod을 모두 실행하는 것은 불가능했던거죠.

결국 타협을 보고 사양은 더 낮지만 ARM이 아닌 Intel Mac에 Kubeflow 설치를 했었습니다. 하지만 사양이 너무 낮아 원하는대로 Kubeflow를 사용하기 어려웠습니다. 결국 제대로 된 공부를 위해서 윈도우 데스크탑에 리눅스 환경을 구성하여 Kubeflow를 설치하였습니다. 

본 포스트는 윈도우 환경에서 WSL로 리눅스 환경을 구성해 Kubeflow를 설치하는 방법을 다룹니다. 만약 **윈도우 환경도 ARM이라면 M1 Mac과 같은 이유로 Kubeflow 설치가 불가능**할 수 있으므로 주의하시기 바랍니다.



## WSL2 설치

Kubeflow는 윈도우 환경을 지원하지 않습니다. 다행히 윈도우는 WSL을 통해 리눅스 환경을 제공해주기 때문에 WSL을 설치하여 사용하였습니다. WSL 설치와 관련된 글들은 너무 많아 아래 링크들로 갈음하도록 하겠습니다. 참고로 저는 Ubuntu 20.04 LTS를 설치하였습니다.

-   [https://llighter.github.io/install_wsl2/](https://llighter.github.io/install_wsl2/)
-   [https://www.44bits.io/ko/post/wsl2-install-and-basic-usage](https://www.44bits.io/ko/post/wsl2-install-and-basic-usage)

### 사소한 팁

#### 메모리 제한

WSL2 특성상 데스크탑의 메모리를 모두 사용하는 것을 방지하기 위해 `%UserProfile%\.wslconfig` 파일에 다음 내용을 추가하여 최대 메모리를 제한하였습니다. 만약 해당 파일이 없다면 생성하여 안에 내용을 작성하시면 됩니다. 제 데스크탑의 메모리는 32GB로 이 중 절반만 사용할 수 있도록 하였습니다. 자세한 내용은 [WSL 깃허브 이슈](https://github.com/microsoft/WSL/issues/4166#issuecomment-526725261)에서 확인하실 수 있습니다.

```
[wsl2]
memory=16GB
swap=0
localhostForwarding=true
```

만약 WSL이 실행 중이라면 Powershell을 통해 WSL을 완전히 끈 다음 재실행하여 변경 사항을 적용시키면 됩니다.

```powershell
wsl --shutdown
```

#### WSL 경로 변경

WSL은 기본적으로 윈도우가 설치된 드라이브에 설치됩니다. 대부분 윈도우가 설치된 저장 공간은 크기 않기 때문에 WSL이 차지하는 용량을 감당하기 어려운 경우가 많습니다. 그리고 Docker를 설치하여 사용하게 되면 사용하는 저장 공간은 더욱 커지기 때문에 다른 로컬 디스크를 이용하는 것을 고려해야 합니다. 제 경우도 윈도우가 설치된 드라이브는 128GB여서 Docker와 WSL의 크기를 감당하지 못해서 결국 훨씬 용량이 큰 로컬 디스크로 피신시켰습니다.

WSL 관련 파일들을 이동시키기 위해서는 [LxRunOffline](https://github.com/DDoSolitary/LxRunOffline)이라는 프로그램이 필요합니다. 해당 프로그램을 설치할 때는 WSL이 아닌 윈도우 Powershell에서 Chocolatey나 Scoop을 이용해서 설치해야 합니다.

```powershell
# Via Chocolatey
choco install lxrunoffline

# Via Scoop
scoop install lxrunoffline
```

설치가 완료되면 다시 Powershell에서 다음의 명령어를 통해 WSL 파일들을 문제 없이 이동시킬 수 있습니다.

```powershell
lxrunoffline move -n {DISTRO_NAME} -d {DESTINATION}
```

추후 Docker 설치 후 생기는 distro도 동일한 방법으로 옮길 수 있습니다.

#### WSL 종료하기

WSL을 사용한 다음 창만 끈다면 WSL은 여전히 실행 중인 상태로 메모리를 점유하게 됩니다. 위에서 물론 전체 메모리의 일부만 할당하였지만 그 자체로도 크기 때문에 종료 후 Powershell에서 `wsl --shutdown` 으로 완전히 종료하는 것을 추천드립니다.

## 환경 구성

### Docker Desktop 설치

Intel Mac에서와 동일하게 Docker 설치를 해줘야 합니다. [다운로드 페이지](https://www.docker.com/products/docker-desktop/)에서 Docker Desktop을 설치합니다. 이때 설치 옵션 중 **WSL2 엔진을 사용한다**는 옵션을 반드시 선택해야 합니다. 만약 설치 중 선택하지 않았더라도 Docker Desktop 설정에서 해당 옵션을 켤 수 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-05-29-install-kubeflow-on-wsl/docker-settings.png" alt="docker-wsl-settings" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">해당 옵션을 반드시 켜야 합니다.</figcaption>
  </figure>
</center>

만약 Docker가 차지하는 용량이 너무 많아 디스크가 부족해진다면 Kubeflow를 올바르게 실행할 수 없으므로 위처럼 LxRunOffline을 이용하여 Docker 이미지를 모두 옮겨주시기 바랍니다.

### Minikube 설치

여기서부터 윈도우 환경이 아닌 WSL에서 설치를 진행해야 합니다. 우선 Minikube부터 설치할텐데요. WSL에도 Homebrew를 설치할 수 있기 때문에 Homebrew를 이용하여 설치하거나 공식 문서에서 제공하는 방법으로 설치할 수 있습니다.

```bash
# Homebrew 이용하여 설치
brew install minikube

# 공식 문서에서 제공하는 방법을 이용하여 설치
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

설치가 완료되었다면 다음의 명령어를 실행하여 Minikube를 구동합니다.

```bash
minikube start --cpus 4 --memory 16384 --kubernetes-version=v1.21.12
```

쿠버네티스는 이전 포스트에서 언급한 것처럼 1.22 미만 버전으로 설치해야 합니다.

#### Kustomize 설치

이전 포스트와 동일합니다. 다음의 명령어로 Kustomize 3.10.0 버전을 설치합니다.

```bash
wget https://github.com/kubernetes-sigs/kustomize/releases/download/kustomize%2Fv3.10.0/kustomize_v3.10.0_darwin_amd64.tar.gz
tar -zxvf kustomize_v3.10.0_darwin_amd64.tar.gz
sudo mv kustomize /usr/local/bin/kustomize
```

## Kubeflow 설치

마지막으로 Kubeflow 최신 버전만 설치하면 됩니다. 설치 역시 이전 포스트와 유사합니다. Kubeflow Manifests를 복사해와서 Kustomize를 이용해 설치하면 됩니다.

```bash
git clone https://github.com/kubeflow/manifests.git

cd manifests
while ! kustomize build example | kubectl apply -f -; do echo "Retrying to apply resources"; sleep 10; done
```

설치 후 15분 정도가 지나면 모든 Pod이 정상 실행되는 것을 확인할 수 있습니다.

```bash
kubectl get pods -A
```

끝으로 Kubeflow Dashboard에 접근하기 위해서 `istio-ingressgateway` 서비스의 포트를 포워딩해줍니다.

```bash
kubectl port-forward -n istio-system svc/istio-ingressgateway 8080:80  
```

이제 `http://127.0.0.1:8080`에 접속하여 Kubeflow Dashboard를 확인하면 됩니다.