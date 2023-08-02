---
title: Docker 명령어 실행 시 권한 오류 발생할 때
layout: post
tags: [docker]
category: DevOps
image:
  path: https://i.imgur.com/3J5NYFA.png
  alt: 
---

`docker images` 등 Docker 명령어를 사용할 때 다음과 같은 권한 오류가 발생하는 경우가 있습니다.

```
Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get http://%2Fvar%2Frun%2Fdocker.sock/v1.40/containers/json: dial unix /var/run/docker.sock: connect: permission denied
```

이 오류는 `/var/run/docker.sock`에 접근하려고 하였으나 그 권한이 없어서 발생합니다. 당연히 단순하게 `root` 권한으로 실행하면 문제는 없지만 권장하는 방식이 아니기 때문에 다른 방법으로 문제를 해결해야 합니다.

이 문제를 해결하기 위해서는 `docker` 그룹에 사용자를 추가해야 합니다.

1) 일반적으론 Docker 설치 시 `docker` 그룹이 생성되지만 만약을 위해서 아래 명령어를 실행합니다.

```bash
sudo groupadd docker
```

2) `docker` 그룹에 사용자를 추가합니다.
```bash
sudo usermod -aG docker $USER
```

3) `docker` 그룹으로 로그인 하기 위해 다음 명령어를 입력합니다. 
```bash
newgrp docker
```

