---
title: Crontab에서 Pyenv + Pipenv 가상환경 통해서 실행하도록 하기
tags: [crontab, pyenv, pipenv]
category: Python
aside:
  toc: true
show_category: true
---


<!--more-->

## 들어가며

전 원래 Python에서 가상환경을 관리할 때 Conda를 썼었습니다. 이유라곤 사실 익숙함 하나였고 불편함을 느끼진 않았습니다. 부족한 부분이라고 한다면 크게 두 가지 정도였을까요? 하나는 용량입니다. Conda는 Python 다중 버전을 관리하는 기능도 있는 데다 라이브러리를 설치할 때 생각하지도 않았던 다른 라이브러리가 같이 설치되곤 합니다. 그러다 보니 차지하는 용량이 어마어마하죠. 이 포스트에서 다룰 [Pipenv와 비교하면 여덟 배 넘게 차이가 난다](https://towardsdatascience.com/pipenv-vs-conda-for-data-scientists-b9a372faf9d9)고 하네요. 두 번째는 사용할 가상환경 이름을 반드시 알아야 한다는 점입니다. 까먹었을 때 찾아보면 된다지만 그래도 번거롭기는 매한가지입니다.

다른 방법으로 가상환경을 관리해야 할만큼 치명적인 문제는 아니었지만 다른 시도를 해보고 싶었습니다. 그래서 이번에 진행하는 프로젝트에선 [Pyenv](https://github.com/pyenv/pyenv)와 [Pipenv](https://pipenv.pypa.io/)를 함께 사용하여 가상환경을 관리하고 있는데요. 사용에 어려움은 없었지만 Crontab 스케줄링을 위해 쉘 스크립트를 작성하면서 버벅거린 부분이 있어 그 내용을 기록하고자 합니다.

## 설명

### 디렉토리 구조

`/home` 밑에 있는 계정 루트 폴더에 일 배치로 수행하는 프로젝트 폴더가 있다고 가정하겠습니다. 폴더 이름을 `project-folder` 라고 한다면 해당 폴더의 절대 경로는 `/home/user/project-folder` 입니다. Pipenv를 사용하여 관리하는 패키지 목록과 그 lock 파일은 당연히 해당 폴더 밑에 있습니다. 스케줄링에 사용할 쉘 스크립트 파일은 `/home/user` 에 있습니다.

보통 프로젝트 폴더에서 `main.py` 파일을 실행할 때는 해당 폴더에 가서 `pipenv run python main.py`를 하면 되지만 지금처럼 쉘 스크립트가 같은 폴더에 없거나 외부에서 실행을 해야 하는 경우는 조금 다릅니다. 만약 아무런 설정 없이 쉘 스크립트 내에 `pipenv run python /home/user/project-folder/main.py` 를 넣어놓고 실행하면 적절한 Python 버전을 못찾을 뿐만 아니라 Pipfile로 못찾아서 위 명령어를 실행한 위치에 불필요한 Pipfile만 만들게 됩니다.

### 방법

이 문제를 해결하려면 Pipfile의 경로와 사용하는 Python의 버전을 환경 변수에 입력하면 됩니다. 만약 Pyenv를 이용해서 설치한 여러 Python 버전 중 3.8.10 버전을 사용한다면 실행할 쉘 스크립트 파일에 다음과 같이 적어놓으면 됩니다.

```bash
export PIPENV_PIPFILE=/home/user/project-folder/Pipfile
export PYENV_VERSION=3.8.10

pipenv run python /home/user/project-folder/main.py
```

> 💡 덧붙여 쉘 스크립트 파일에 Crontab이 사용자가 설정한 `PATH`를 가져오지 않기 때문에 Pipenv가 있는 경로를 `PATH`에 추가해야 합니다.

Pipenv 공식문서에서 [PIPENV_PIPFILE](https://pipenv.pypa.io/en/latest/advanced/#pipenv.environments.Setting.PIPENV_PIPFILE)의 설명을 찾아볼 수 있습니다.

> <b>`PIPENV_PIPFILE`</b>
> 
> 직접 Pipfile 파일 위치를 지정합니다. Pipfile이 있는 디렉터리가 아닌 다른 위치에서 `pipenv`를 실행하는 경우 이 환경 변수에서 지정한 위치의 Pipfile을 찾도록 합니다.
> 기본값으로 설정하면 현재 디렉토리와 상위 디렉토리에서 Pipfile을 찾습니다.

`PYENV_VERSION`은 Pyenv로 설치한 Python 버전을 설정하는 환경 변수입니다. 매번 실행 때마다 두 값을 환경 변수에 입력하도록 하고 `pipenv run` 으로 원하는 파일을 원하는 Python 버전으로 실행하게 하면 문제 없이 실행하는 것을 확인할 수 있습니다.

## 나가며

매우 간단하지만 Pyenv와 Pipenv에 사용되는 환경 변수를 놓쳐서 많이 헤매는 지점이 되는 듯 합니다. Conda를 쓰면 문제 없는거 아니냐고 하실 수 있는데, 사실 쉘 스크립트 안에 들어가는 내용만 따지고 보면 Conda보다 Pyenv + Pipenv 조합이 훨씬 간단합니다. Conda라면 쉘 스크립트 안에 다음과 같이 작성해야 합니다. Conda가 설치된 위치에 `/etc/profile.d/conda.sh`를 불러오고, 원하는 가상환경 이름을 이용해 `conda activate` 하고, 원하는 작업이 끝나면 `conda deactivate`로 가상환경을 빠져나오도록 해야 합니다. 제법 번거롭습니다.

프로젝트의 바쁜 일이 다 끝나면 Pipenv도 [Poetry](https://python-poetry.org/)로 바꿔볼까 합니다. 요즘엔 Pyenv + Poetry 조합을 매우 많이 쓴다고 합니다. Pipenv보다 더 빠르게 패키징하고 라이브러리를 설치할 수 있는게 큰 장점이라고 하네요.
