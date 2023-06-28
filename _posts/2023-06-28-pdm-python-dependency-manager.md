---
title: 파이썬 의존성 관리 도구 PDM
layout: post
tags: [pdm, dependency, pipenv, pyenv, poetry]
category: Python
image:
  path: https://res.cloudinary.com/snyk/image/upload/v1530707820/wordpress-sync/Python-feature-1.png
  alt: Dependency management
---

## 들어가며

저는 파이썬 의존성 관리 도구로 Pipenv를 사용하고 있었습니다. Poetry로 넘어가려다가 귀찮음에 빠져 계속 Pipenv를 사용하고 있었거든요. Pyenv로 파이썬 다중 버전 관리를 하고 Pipenv로 의존성 관리를 하면 충분하기도 했었구요. 딱 하나 아쉬웠던건 속도였습니다. 라이브러리를 설치할 때 의존성 관리와 lock 파일 생성에 너무 많은 시간이 걸리곤 했습니다. 설치 명령어 입력해놓고 손 떼고 쉬던 적도 몇 번 있으니까요.

![](https://i.imgur.com/3umk18b.png){:w ="600"}

그래서 'Poetry로 넘어가야 되려나' 라고 생각하던 찰나에 [**PDM**](https://github.com/pdm-project/pdm)이란 관리 도구를 알게 되었습니다. 

<a href="https://asciinema.org/a/jnifN30pjfXbO9We2KqOdXEhB" target="_blank"><img src="https://asciinema.org/a/jnifN30pjfXbO9We2KqOdXEhB.svg" /></a>

위 영상을 보고 든 첫 인상은 **빠르다**와 **보여주는 정보가 많다** 였습니다. Pipenv와 비교해서 굉장히 빠른 속도를 가진 것 같았고, Pipenv와 다르게 어떤 의존성을 설치하는지 보여주는게 매력적이었습니다. 확인해보니 설치도 어려운 것 같지 않아 시험삼아 사용해봤는데 아주 만족스러웠습니다.

## 사용하기

저는 원래 Pyenv + Pipenv 를 사용하고 있었기 때문에 이번에도 Pyenv + PDM 으로 사용하고자 했습니다. 본 포스트는 Pyenv가 설치되어 있다는 가정 하에 진행하도록 하겠습니다. Pyenv 설치는 [이 곳](https://github.com/pyenv/pyenv#installation)을 확인하시고 진행하시면 됩니다. 참고로 Pyenv는 윈도우에서 사용이 불가능합니다. Windows에서 Pyenv를 사용하시려면 WSL을 이용하시기 바랍니다.

### 설치

PDM 설치는 여러 방법을 통해서 할 수 있습니다. 설치 스크립트를 이용하는 방식은 다음 명령어를 실행하는 것입니다.

```shell
curl -sSL https://pdm.fming.dev/dev/install-pdm.py | python3 -
```

이외에도 홈브루나 `pip`를 사용해서 설치할 수 있습니다.

```shell
brew install pdm
```

```shell
pip install --user pdm
```

### 새로운 프로젝트 생성하기

우선 프로젝트를 진행할 폴더를 생성하고 접근합니다.

```shell
mkdir pdm-test; cd pdm-test
```

그리고 PDM 명령어를 통해 초기화합니다.

```shell
pdm init
```

그러면 다음과 같은 화면이 출력됩니다.

![](https://i.imgur.com/Efxosls.png){: w="800"}

어떤 Python 버전을 사용할 것이냐는 질문인데, 저는 Pyenv로 설치해놓은 3.9.16 버전이 있어서 4번을 선택하도록 하겠습니다. 그 다음엔 해당 Python 버전으로 가상환경을 만들 것이냐고 물어보는데 `Y`를 입력합니다.

```shell
Would you like to create a virtualenv with /Users/jayhan/.pyenv/versions/3.9.16/bin/python3.9? [y/n] (y): y
```

이후에는 그냥 Enter만 누르면 됩니다.

![](https://i.imgur.com/NH9AC28.png){: w="800"}
이제 디렉토리를 살펴보면 가상환경 폴더와 `pyproject.toml`이 생성된 것을 확인하실 수 있습니다.

![](https://i.imgur.com/VcR7myf.png){: w="800"}
### 가상환경 실행하기

가상환경에 대한 정보는 모두 `.venv` 폴더에 담겨져 있습니다.

![](https://i.imgur.com/VxARROv.png){: w="800"}
가상환경을 활성화하기 위해서 아래 명령을 입력합니다.

```shell
source .venv/bin/activate
```

그리고 환경 내 Python이 원하던 3.9.16 버전인지 확인하시면 됩니다.

```shell
python --version
```

가상환경에서 나올 때에는 `deactivate` 로 빠져나올 수 있습니다.

### 의존성 설치하기

의존성 설치는 Pipenv나 Poetry 처럼 간단합니다. 

```shell
pdm add {PACKAGE_NAMES}
```

저는 Pandas와 Numpy, Scikit-learn을 설치하겠습니다.

```shell
pdm add pandas numpy scikit-learn
```

![](https://i.imgur.com/5hhNqYu.png){: w="800"}
그러면 Pipenv보다 훨씬 빠른 시간 내에 다음과 같이 설치되고 `pdm list` 라는 명령어로 설치된 의존성을 확인할 수 있습니다.

![](https://i.imgur.com/oyMeDuE.png){: w="800"}
`pyproject.toml` 파일을 살펴보셔도 좋습니다.

```toml
[project]
name = ""
version = ""
description = ""
authors = [
    {name = "Jaeyoon Han", email = "otzslayer@gmail.com"},
]
dependencies = [
    "pandas>=2.0.2",
    "numpy>=1.25.0",
    "scikit-learn>=1.2.2",
]
requires-python = ">=3.9"
license = {text = "MIT"}
```

개발 시에만 사용할 의존성은 다음과 같이 설치합니다.

```shell
pdm add -d black isort
```

## 나가며

사용해보고 느낀 점은 이름도 그렇지만 `npm`과 정말 비슷하다는 것입니다. 그리고 많은 정보를 화면에 출력해줘서 사용성이 높다는 것이었구요.

사실 PDM의 진가는 설치가 필요한 라이브러리를 만들 때 볼 수 있습니다. 실제로 깃허브 저장소에 PDM 소개글엔 다음과 같이 써있습니다.

> PDM is meant to be a next generation Python package management tool. It was originally built for personal use. If you feel you are going well with `Pipenv` or `Poetry` and don't want to introduce another package manager, just stick to it. But if you are **missing something that is not present in those tools**, you can probably find some goodness in `pdm`.
> 
> PDM은 차세대 Python 패키지 관리 도구입니다. 원래는 개인용으로 만들어졌습니다. Pipenv나 Poetry를 문제 없이 사용하고 있고, 다른 패키지 관리자를 도입하고 싶지 않다면 원래 사용하던걸 사용하셔도 됩니다. 하지만 **해당 도구에 없는 기능**이 필요하다면 PDM이 좋은 선택이 될 수 있습니다.
{:.prompt-info}

여기에서 말하는 해당 도구에 없는 기능이 Pipenv라면 라이브러리 배포를 위한 설치 도구 관리, Poetry라면 프로젝트 메타데이터와 관련된 [PEP 621](https://peps.python.org/pep-0621/) 관련 내용일 것입니다. PDM은 이 모든 것을 가능하게 만들기에 충분히 매력적인 도구라고 생각됩니다.