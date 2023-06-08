---
title: M1 Mac (Apple Silicon)에서 Conda 환경 설정하기
tags: [conda, mac, setting-environment]
category: ML
aside:
  toc: true
show_category: true
---

무언가 다르다는 M1 맥북에서의 Conda 환경 설정에 대해 알아봅시다. 👓

<!--more-->

## 들어가며

원래 쓰던 맥북은 2015년 맥북 프로 레티나 13인치이었습니다. 
소위 말하는 마지막으로 상판 사과에 불이 들어오는 맥북이죠.
애지중지하며 쓰고 있었지만 어느 순간부터 업데이트되는 OS를 쫓아가기엔 버거운 녀석이 되었죠.
그래서 이번에 큰 마음을 먹고 맥북 프로 14인치 M1 Pro를 구매했습니다. 

M1이 처음 나왔을 때부터 관심을 갖고 많은 글을 읽었어서 인텔 맥과는 조금 다르게 설정해야 한다는 것을 미리 알고 있었습니다.
별로 복잡하지는 않지만 나중을 위해서 짧게나마 정리하고자 합니다.

## 환경 설정

### Miniforge 설치

기존 인텔 맥에서는 최신 버전의 Anaconda를 설치하면 됐었습니다.
하지만 현재의 Anaconda는 아직 Apple Silicon을 완벽하게 지원하고 있지 않습니다.
다행히 Miniforge는 공식적으로 Apple Silicon을 지원하고 있습니다.

<center>
	<figure>
		<img src="/assets/images/2021-12-17-configure-conda-env-in-m1-mac/miniforge.png" alt="miniforge" style="zoom:50%;" loading="lazy" />
		<figcaption style="text-align: center;">Miniforge</figcaption>
	</figure>
</center>

[Miniforge 저장소](https://github.com/conda-forge/miniforge)로 접속하여 Apple Silicon용 Miniforge 설치 쉘 스크립트를 다운로드합니다.
다운로드 후 터미널로 다운로드한 쉘 스크립트를 실행합니다.

```bash
$ bash Miniforge3-MacOSX-arm64.sh
```

설치 과정 중 약관 동의를 몇 차례 하고 나면 설치가 완료됩니다. 
이 때 `conda init`을 수행하냐는 질문을 하는데 수행하시는 것이 훨씬 편합니다. 
`conda init`을 한 후에는 쉘 환경을 다시 켜주셔야 합니다.
그리고 저의 경우엔 터미널을 실행시켰을 때 `base` 환경이 자동으로 활성화되는 것이 싫어서 다음의 명령어를 추가로 실행했습니다.

```bash
$ conda config --set auto_activate_base false
```

여기까지 하셨다면 Conda 환경을 사용하실 수 있고, 가상환경을 생성하실 수 있습니다.
저의 경우는 Python 3.9 버전을 사용하는 환경을 만들었습니다.

```bash
$ conda create -n mlenv python=3.9
```

### Openblas 설치

이제 `numpy`나 `scipy` 같은 라이브러리를 설치해야 하는데, Apple Silicon에서는 Openblas를 사용하는 몇몇 라이브러리 설치에서 오류가 발생한다는 글을 많이 보았습니다. [(출처)](https://stackoverflow.com/questions/65745683/how-to-install-scipy-on-apple-silicon-arm-m1)
그래서 Homebrew를 이용해 Openblas를 설치하고, 설치한 Openblas를 이용해 위에서 언급한 라이브러리를 설치하도록 하였습니다.
Homebrew는 아래 명령어로 설치할 수 있습니다.

```bash
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Homebrew 설치 후, Openblas를 설치합니다.

```bash
$ brew install openblas
```

그리고 다른 라이브러리를 `pip`로 설치할 때 지금 설치한 Openblas를 인식할 수 있도록 설정합니다.

```bash
$ export OPENBLAS=$(/opt/homebrew/bin/brew --prefix openblas)
$ export CFLAGS="-falign-functions=8 ${CFLAGS}"
```

그 후 원하는 라이브러리를 설치하면 됩니다.

### Tensorflow 설치

Apple Silicon에서 Tensorflow를 설치하기 위해서는 인텔 Mac과는 달리 conda에서 의존성을 추가로 설치해야 합니다.
Apple 채널에서 `tensorflow-deps`를 설치해줍니다.

```bash
$ conda install -c apple tensorflow-deps
```

그 후 Tensorflow와 `tensorflow-metal` 플러그인을 설치합니다.

```bash
$ python -m pip install tensorflow-macos
$ python -m pip install tensorflow-metal
```

참고로 현재 지원되지 않는 것들은 다음과 같습니다.

- 멀티 GPU 지원
- 인텔 GPU 가속
- V1 Tensorflow 네트워크