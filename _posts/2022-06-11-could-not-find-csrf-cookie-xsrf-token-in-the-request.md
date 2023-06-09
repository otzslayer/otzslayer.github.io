---
title: Kubeflow에서 Notebook 생성 시 Could not find CSRF cookie XSRF-TOKEN in the request 에러 발생할 때
tags: [csrf, xsrf-token, kubeflow, mlops]
category: Kubeflow
aside:
  toc: true
show_category: true
layout: post
---

Could not find CSRF cookie XSRF-TOKEN in the request?

<!--more-->

## 들어가며

Kubeflow를 설치하고 가장 먼저 접하는 컴포넌트는 아무래도 Notebook 환경이 됩니다. 적어도 "Hello, world!" 같은 느낌으로 시작을 해보려면 Notebook 생성을 한 번 정도는 하게 되는데요. 시작과 동시에 다음과 같은 에러를 접하게 되는 경우가 있습니다.

```
[403] Could not find CSRF cookie XSRF-TOKEN in the request. 
http://<IP Address>:8080/jupyter/api/namespaces/kubeflow-user-example-com/notebooks
```

XSRF-TOKEN 이야기가 나오는걸로 봐선 보안 관련 문제인 것 같아 겨우 해결 방법을 찾게 되었습니다.

## 어떤 문제?

### 문제 분석

제가 사용하고 있는 환경은 사실 로컬호스트가 아닌 원격 환경이었습니다. 우선 WSL에 Kubeflow를 띄워 포트포워딩하여 사용하고 있었고, WSL 아이피를 로컬호스트로 할당한 상태에서 외부에서 접근할 수 있게 설정해 맥북에서 아이피와 포트를 통해 접근하고 있었습니다. 그래서 Notebook 생성이 어떤 경우에도 안되는 것인가 싶어 로컬호스트 주소인 `localhost:8080`로 들어간 다음 생성해보니 문제 없이 생성되는 것을 확인했습니다. 처음에는 원격에서는 원래 생성이 안되는 것인가 싶었죠. 조금 시간을 들여 검색해보니 **HTTP로 접근하게 되면 발생하는 오류**인 것을 알게 되었습니다.

이게 무슨 상황인가 싶어서 보니 로컬호스트는 HTTPS로 대시보드를 접근하게 되어 있었고 아이피를 통한 접근은 모두 HTTP로 접근하게 되어 있었던거죠. 원격으로 접근하는 것 역시 아이피를 통한 접근이었기 때문에 생성이 되지 않았던 것입니다.  

### 문제 해결

제가 찾은 문제를 해결할 수 있는 방법은 두 가지입니다. 하나는 HTTP 접근을 허용하는 것, 나머지 하나는 `self-signing-issuer`를 이용하는 것인데요. **물론 보안 측면에서는 후자를 택하는 것이 일반적이고 권장됩니다.** 하지만 해결하는 방법이 생각보다 쉽지는 않았습니다. 실제로 시도해 보았지만 오히려 HTTPS 접근할 때 접속이 아예 되지 않아 Kubeflow를 재설치하는 삽질을 하고 말았구요. 제가 실수한 부분이 클텐데 권장하는 해결 방안은 나중에 시도해보기로 하고 당장 가볍게 개인 용도로 사용하기 위해 간단한 방법으로 해결하였습니다. 올바른 해결 방법은 [여기](https://github.com/mlops-for-all/mlops-for-all.github.io/issues/72#issuecomment-1007537301)를 참고하시기 바랍니다. 자세하게 설명되어 있습니다.

Notebook 생성 시 HTTP 허용을 위해서는 Jupyter의 재설치가 필요합니다. 재설치에 앞서 Jupyter 설정에 Secure Cookie를 해제하는 설정값을 추가해야 합니다. 설치 파일이 있는 폴더에서 다음 파일을 수정하면 됩니다.

```
manifest/apps/jupyter/jupyter-web-app/upstream/base/deployment.yaml
```

파일을 열어 다음의 내용을 추가합니다.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment
spec:
  replicas: 1
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "false"
    spec:
      containers:
      - name: jupyter-web-app
        image: public.ecr.aws/j1r0q0g6/notebooks/jupyter-web-app
        ports:
        - containerPort: 5000
        volumeMounts:
        - mountPath: /etc/config
          name: config-volume
        - mountPath: /src/apps/default/static/assets/logos
          name: logos-volume
        env:
        - name: APP_PREFIX
          value: $(JWA_PREFIX)
        - name: UI
          value: $(JWA_UI)
        - name: USERID_HEADER
          value: $(JWA_USERID_HEADER)
        - name: USERID_PREFIX
          value: $(JWA_USERID_PREFIX)
        # 여기서부터 추가합니다.
        - name: APP_SECURE_COOKIES
          value: "false"
        # 위 내용까지 추가합니다.
      serviceAccountName: service-account
      volumes:
      - configMap:
          name: config
        name: config-volume
      - configMap:
          name: jupyter-web-app-logos
        name: logos-volume
```

그 다음 다음 명령어를 통해 다시 설치하시면 됩니다. 물론 아래 명령어가 아니라 Kubeflow 원클릭 설치 방법으로도 가능합니다. 어차피 변경 사항이 없는 Pod들은 영향을 받지 않으니까요.

```
kustomize build apps/jupyter/jupyter-web-app/upstream/overlay/istio | kubectl apply -f -
```

이후 다시 포트포워딩하여 대시보드에 접속해 Notebook을 생성해보면 정상적으로 생성되는 것을 확인하실 수 있습니다.