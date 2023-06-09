---
title: Argo에서 파이프라인 서브밋 시 권한 문제가 발생할 때
tags: [kubeflow, mlops, argo, rolebinding]
category: Kubeflow
layout: post
---


<!--more-->

## 문제 발생

Argo를 설치하고 `kubectl`로 Argo Pod을 띄운 뒤 간단한 파이프라인을 `kubeflow` 네임스페이스로 서브밋했습니다.

```bash
$ argo submit -n kubeflow --watch https://raw.githubusercontent.com/argoproj/argo-workflows/master/examples/hello-world.yaml
```

그랬더니 다음과 같은 권한 문제가 발생했습니다.

```
Error (exit code 1): pods "hello-world-b6xj5" is forbidden: User "system:serviceaccount:kubeflow:default" cannot patch resource "pods" in API group "" in the namespace "kubeflow"
```

## 문제 해결

위 문제는 `kubeflow:default`라는 서비스 어카운트를 `kubeflow` 네임스페이스에 Rolebinding을 해주지 않아서 발생하는 문제입니다. 관련 이슈는 제법 많은 곳에서 찾을 수 있었습니다. 제가 확인한 이슈는 [여기](https://github.com/argoproj/argo-workflows/issues/1021)를 참고하시기 바랍니다. 

문제 해결을 위해서는 단순히 Rolebinding을 생성해주면 되는데요. 이때 반드시 네임스페이스를 명시해줘야 문제가 발생하지 않습니다. 저는 `kubeflow` 네임스페이스로 파이프라인을 서브밋할 때 문제가 발생했었으므로 아래 명령에서도 `--namespace=kubeflow` 를 추가했습니다.

```bash
$ kubectl create rolebinding default-admin --clusterrole=admin --serviceaccount=kubeflow:default --namespace=kubeflow
```

이후 다시 파이프라인을 `kubeflow` 네임스페이스로 서브밋하면 올바르게 작업이 수행됨을 확인할 수 있습니다.

```
STEP                  TEMPLATE  PODNAME            DURATION  MESSAGE
 ● hello-world-hxkrs  whalesay  hello-world-hxkrs  10s
Name:                hello-world-hxkrs
Namespace:           kubeflow
ServiceAccount:      default
Status:              Succeeded
Conditions:
 PodRunning          False
 Completed           True
Created:             Sun Jul 03 16:57:04 +0900 (26 seconds ago)
Started:             Sun Jul 03 16:57:04 +0900 (26 seconds ago)
Finished:            Sun Jul 03 16:57:30 +0900 (now)
Duration:            26 seconds
ResourcesDuration:   14s*cpu,4s*memory

STEP                  TEMPLATE  PODNAME            DURATION  MESSAGE
 ✔ hello-world-hxkrs  whalesay  hello-world-hxkrs  15s
```

```bash
$ argo list -n kubeflow

NAME                STATUS      AGE   DURATION   PRIORITY
hello-world-hxkrs   Succeeded   4h    26s        0
```