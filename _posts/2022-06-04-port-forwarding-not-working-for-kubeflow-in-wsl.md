---
title: WSL에서 Kubeflow 포트포워딩이 안될 때
tags: [wsl, port-forward, kubeflow, mlops, setting-environment]
category: Kubeflow
aside:
  toc: true
show_category: true
---

로컬에서 쓰는 Kubeflow는 쉽지 않네요. :(

<!--more-->

## 들어가며

이전 포스트에서 말씀드린 것처럼 전 Kubeflow를 로컬 환경에서 가볍게 사용하기 위해 WSL에 설치하였습니다. 최초 설치 후에 Central Dashboard 접속이 원활하였고, 이후에도 몇 번 접속하여 잘 사용하고 있었습니다. 그런데 갑자기 오늘 접속이 안 되는 문제가 발생하였습니다. Pod 실행도 모두 잘 되는 상황이었고 서비스도 정상적으로 띄워져 있었는데요. 몇 시간 동안의 삽질 끝에 문제의 원인을 알게 되었고, 그 해결 방법을 본 포스트를 통해 공유하고자 합니다.

## 문제의 상황

Central Dashboard 접속을 위해 포트포워딩을 하여 localhost로 접속하려 했습니다.

```bash
kubectl port-forward svc/istio-ingressgateway -n istio-system 8080:80
```

분명 포트포워딩은 올바르게 됐는데 접속이 아예 되지 않았습니다. 아무리 다시 포트포워딩을 해도 접속이 안되었고, 무언가 이상하여 다음을 실행해보았습니다.

```bash
curl http://127.0.0.1:8080
```

포트포워딩이 제대로 안되거나 다른 문제가 있다면 반드시 `Connection refused`가 출력되어야 하지만 이상하게도 제대로 된 페이지 내용이 출력되었습니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-04-port-forwarding-not-working-for-kubeflow-in-wsl/port-forwarding.png" alt="Port forwarding" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">포트포워딩이 되어 있기는 한데...</figcaption>
  </figure>
</center>

## 해결

우선 서비스 실행이 문제는 아니었기 때문에 몇 가지 가설을 세워봤습니다. 그중에서 확실히 문제가 생길 수 있다고 생각한 것이 **"WSL에서의 localhost와 호스트 윈도우의 localhost가 다를 수 있다."** 였습니다. 그래서 검색을 조금 해보니 **윈도우 IP와 WSL에서의 IP가 다르게 설정될 뿐만 아니라, WSL을 재부팅 하거나 로컬 PC를 재부팅 하면 IP가 매번 새로 할당되는 특징이 있다는 내용**이 있었습니다. 심지어는 절전 모드 후에도 재설정되는 경우가 있다고 합니다. 따라서 외부에서 접속할 수 있는 별도의 아이피로 Central Dashboard로 접근하고, WSL의 IP를 알아내기만 하면 되는 문제라고 생각했습니다.

그래서 우선 포트포워딩을 다시 했습니다.

```bash
kubectl port-forward --address=0.0.0.0 svc/istio-ingressgateway -n istio-system 8080:80
```

이제 WSL의 IP만 알아내면 되는데요. Powershell에서 다음 명령어를 실행합니다.

```powershell
wsl hostname -I
```

그러면 WSL의 IP를 알 수 있습니다. 

>   :bulb: 참고로 매번 이렇게 WSL의 IP를 알아낼 수도 있지만 번거롭다고 느끼시는 분들은 WSL를 고정 IP로 설정하여 사용할 수도 있습니다. [넷마블 기술 블로그](https://netmarble.engineering/wsl2-static-ip-scheduler-settings/)에 관련 내용이 있으니 고정 IP로 설정하실 분들은 확인해보시기 바랍니다.

이제 웹브라우저에서 `http://<WSL_IP>:8080` 으로 접속하면 Kubeflow Central Dashboard로 접근할 수 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-06-04-port-forwarding-not-working-for-kubeflow-in-wsl/central-dashboard.png" alt="Central dashboard" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">Kubeflow Central Dashboard</figcaption>
  </figure>
</center>

## 여담

Kubeflow를 공부하면서 괜히 클라우드 환경에서의 문서만 제공되는 게 아니라는 것을 느끼게 되었습니다. 로컬 환경에서 어떻게든 해보려고 하다가 너무나 많은 삽질을 반복하게 되니 생각보다 피로감이 많이 몰려오네요. 최근 GCP 환경에도 Kubeflow를 사용해보고 있는데 별도의 설치나 설정이 없이 사용할 수 있다는 점에서 역시 시키는 대로 하는 게 맞는 것 같다는 생각도 들고요.

