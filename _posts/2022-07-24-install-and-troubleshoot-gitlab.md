---
title: GitLab 설치와 트러블슈팅
tags: [gitlab, setting-environment]
category: Git
layout: post
---


<!--more-->

<center>
  <figure>
    <img src="/assets/images/2022-07-24-install-and-troubleshoot-gitlab/512px-GitLab_logo.svg.png"
      alt="GitLab logo" style="zoom:75%;" loading="lazy"/>
    <figcaption style="text-align: center;">GitLab Logo from Wikipedia</figcaption>
  </figure>
</center>

## 들어가며

소스 코드의 버전 관리를 위해서 보통 GitHub을 많이 사용합니다. 물론 저희 회사처럼 GitHub이 아닌 BitBucket을 사용하는 경우도 있습니다. 하지만 망분리나 보안의 이유로 둘 다 사용하지 못하는 경우가 생기기도 하는데요. 이럴 때는 오픈소스인 **GitLab**을 이용하게 됩니다. 그래서 GitLab Community Edition (이하 GitLab CE)을 쓰게 되면 사실 다 좋은데 직접 설치를 하는 과정과 문제가 발생했을 때 트러블슈팅을 직접 해야한다는 부담과 번거로움이 생기죠. 본 포스트에서는 GitLab 설치 과정과 설치하며 겪었던 문제를 어떻게 해결했는지 공유해보려 합니다.

## GitLab 설치

설치에 앞서 GitLab을 설치했던 환경은 Ubuntu 20.04 환경입니다. 다른 버전도 비슷하겠지만 설치 전 반드시 환경에 맞는지 확인하셔야 합니다. GitLab 설치는 그다지 어렵지 않습니다.

### 시스템 업데이트 및 의존성 설치

설치 전에 `apt`를 업데이트 하고 필요한 의존성을 설치해줍니다.

```bash
$ sudo apt update
$ sudo apt upgrade -y

$ sudo apt install -y ca-certificates curl openssh-server tzdata
```

### GitLab CE 저장소 추가

GitLab CE 저장소를 추가하여 GitLab CE를 `apt`로 설치할 수 있게 합니다. 앞서 말씀드렸듯 Ubuntu 20.04 환경에서 사용한 명령어이며, 제가 알기론 Ubuntu 18.04에서도 동일하게 수행 가능합니다. Ubuntu 22.04 버전은 명령어가 조금 다르다고 하는데, 이 부분까지 본 포스트에서 다루지는 않겠습니다.

다음 명령어를 통해 GitLab CE 저장소를 추가합니다.

```bash
$ curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ce/script.deb.sh | sudo bash
```

다음 메시지가 출력된다면 올바르게 설정이 완료된 것입니다.

```
The repository is setup! You can now install packages.
```

저장소에 관한 내용은 다음 경로에 추가되어 있습니다.

```bash
cat /etc/apt/sources.list.d/gitlab_gitlab-ce.list
```

### GitLab CE 설치

이제 GitLab CE를 설치합니다. GitLab 홈페이지를 찾아보면 Enterprise Edition에 대한 설명은 굉장히 많은데 Community Edition에 대한 내용은 찾아보기 힘듭니다. 이해는 하지만 조금 너무하네요. GitLab CE 설치는 다음 명령어를 통해 수행할 수 있습니다.

```bash
$ sudo apt install gitlab-ce
```

제대로 설치가 되었다면 다음 메시지가 출력됩니다.

```
It looks like GitLab has not been configured yet; skipping the upgrade script.

       *.                  *.
      ***                 ***
     *****               *****
    .******             *******
    ********            ********
   ,,,,,,,,,***********,,,,,,,,,
  ,,,,,,,,,,,*********,,,,,,,,,,,
  .,,,,,,,,,,,*******,,,,,,,,,,,,
      ,,,,,,,,,*****,,,,,,,,,.
         ,,,,,,,****,,,,,,
            .,,,***,,,,
                ,*,.
  


     _______ __  __          __
    / ____(_) /_/ /   ____ _/ /_
   / / __/ / __/ /   / __ `/ __ \
  / /_/ / / /_/ /___/ /_/ / /_/ /
  \____/_/\__/_____/\__,_/_.___/
  

Thank you for installing GitLab!
```

설치가 완료되었다면 필요한 설정을 바꿔줍니다. 가령 접속 주소나 포트 등이 있겠네요.

```bash
$ sudo vi /etc/gitlab/gitlab.rb
```

설정을 완료하였다면 다음 명령어를 실행하여 GitLab을 재설정해줍니다.

```bash
$ sudo gitlab-ctl reconfigure
```

제법 많은 메시지가 출력될텐데 메시지 출력이 끝나고 관련 서비스들이 올바르게 실행되고 있는지 확인해줍니다.

```bash
$ sudo gitlab-ctl status
```

### GitLab 페이지 접속

위에서 설정한 외부 URL을 통해 접속하면 아래와 같은 화면이 나옵니다.

<center>
  <figure>
    <img src="/assets/images/2022-07-24-install-and-troubleshoot-gitlab/image-20220724193424707.png"
      alt="GitLab Login Page" style="zoom:50%;" loading="lazy"/>
    <figcaption style="text-align: center;">GitLab 접속 페이지</figcaption>
  </figure>
</center>

처음엔 `root` 계정을 제외하곤 다른 계정이 없습니다. 최초 `root` 계정의 비밀번호를 확인하려면 다음 명령어를 실행해야 합니다.

```bash
$ cat /etc/gitlab/initial_root_password
```

제법 긴 비밀번호가 나오는데 그대로 붙여넣으면 대시보드 페이지로 접속이 가능합니다. 여기까지 됐다면 GitLab 설치가 끝났습니다.

## GitLab 관련 트러블슈팅

사실 위 GitLab 설치는 큰 문제가 아닙니다. 이 짧은 설치 과정 동안 적지 않은 문제가 있었는데요. 제가 경험했던 문제들만을 다루었고, 제가 해결한 방법을 공유하고자 합니다.

### `gitlab-ctl reconfigure`시 진행이 되지 않을 때

`gitlab-ctl reconfigure`를 실행하여 GitLab 설정을 다시 적용할 때 어느 구간에서 막힌 채 진행이 안되는 경우가 있습니다. 제 경우엔 다음 메시지에서 더 진행이 안됐었는데요.

```
...
* ruby_block[wait for redis service socket] action run

...
```

검색을 해보니 특정 서비스를 재실행하면 되는 문제였습니다. 다음 명령어를 다른 터미널 창에서 실행하거나 GitLab 재설정을 취소하고 다음 명령어를 실행하면 됩니다.

```bash
$ sudo /opt/gitlab/embedded/bin/runsvdir-start &
```

### 서비스가 실행되지 않을 때

`gitlab-ctl status`로 서비스 실행 여부를 확인했을 때 모든 서비스가 실행되지 않는 경우가 있습니다. 이 경우에도 위와 같은 방법으로 해결 가능합니다.

```bash
$ sudo /opt/gitlab/embedded/bin/runsvdir-start &
```

해당 명령어 실행 후 `gitlab-ctl restart`나 `gitlab-ctl reconfigure`를 통해 GitLab을 다시 켜주면 됩니다.

### 접속 페이지가 뜨지 않을 때

간혹 메인 로그인 페이지가 뜨지 않는 경우가 있습니다. 이 경우 대부분이 포트 설정이 잘못 되어서 그런데요. 접속 포트가 막혀 Connection Timeout이 발생한 경우거나 방화벽 문제로 인해 접속이 안되는 경우입니다. 방화벽 문제라면 조금 복잡해지지만 제 경우엔 접속 포트에 문제가 있었기 때문에 해당 내용을 공유드립니다.

이 문제는 Puma 설정 일부와 외부 URL을 수정하여 해결 가능합니다. 가장 간단하게 로컬호스트로 외부 URL을 설정한다고 가정해보겠습니다. 접속 가능한 포트 두 개가 있을 때 외부 URL에 포트 두 개 중 하나를 쓰고, Puma 설정에 나머지 포트 하나를 쓰면 됩니다. 만약 사용 가능한 포트가 9000, 9001 이라면 이런 식이 됩니다. 우선 설정 파일을 열어줍니다.

```bash
$ sudo vi /etc/gitlab/gitlab.rb
```

그 다음 설정 내용에서 아래와 같이 수정합니다.

```ruby
external_url 'http://localhost:9000'

puma['listen'] = 'localhost'
puma['port'] = 9001
```

그 다음 `sudo gitlab-ctl reconfigure`를 통해 GitLab을 재설정한 다음 조금 기다리면 메인 로그인 페이지가 올바르게 나옵니다.

### 어드민 비밀번호를 까먹었을 때

왜인지 모르겠지만  `cat /etc/gitlab/initial_root_password`에서 초기 비밀번호가 나오지 않는 문제가 있었습니다. 이 경우엔 `root` 계정의 비밀번호를 수동으로 초기화하여 재설정할 수 있습니다.

```bash
$ sudo gitlab-rake 'gitlab:password:reset[root]'
```

원하는 비밀번호를 입력하고 비밀번호 확인까지 마친다면 해당 비밀번호를 `root` 계정의 비밀번호로 사용할 수 있습니다.

