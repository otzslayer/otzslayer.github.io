---
aliases: 
created: 2024-02-23
title: PDM을 이용하여 환경 설정 시 SSL 에러 벗어나기
layout: post
tags: [InsecureRequestWarning, urllib3, python, pdm, sslerror]
category: Python
image:
  path: https://i.imgur.com/fc9JDiS.png
  alt: 
---

## 배경

최근에 회사 네트워크에서 PDM을 사용해서 환경을 설정하는데 이전에는 발생하지 않았던 SSL 에러가 계속 발생하였습니다. 사실 일반적으로는 인증서를 추가해주기만 하면 문제는 해결됩니다. 진짜 문제는 회사의 인증서가 256바이트라서 발생했는데요. 해당 인증서를 통해서 `pypi.org`나 `files.pythonhosted.org`에서 무언가를 받으려고 하면 되려 인증서의 보안 수준이 낮다는 오류가 발생했습니다. 분명 몇 주 전만 하더라도 발생하지 않던 일이라서 문제를 해결하는데 꽤나 고생하여 오랜만에 블로그에 남기고자 합니다. 참고로 아래 내용은 Poetry에서 발생하는 동일한 문제도 해결할 수 있습니다.

## 해결

### 저장소 소스 정보를 추가하기

![](https://i.imgur.com/SBtDQNH.png){: w="800"}

발생하는 `SSLError`를 자세히 살펴보면 `host='files.pythonhosted.org'` 부분이 있습니다. PDM이나 Poetry 같은 의존성 관리 도구는 기본적으로 `pypi.org`를 기본 저장소로 하고 그 다음 `files.pythonhosted.org`에 접근합니다. 에러 내용을 보면 `pypi.org`에서 발생한 `SSLError`가 아니므로 `files.pythonhosted.org`에서 문제가 발생한 것을 알 수 있습니다. 그래서 해당 저장소 정보를 PDM으로 생성한 `pyproject.toml`에 아래와 같이 추가했습니다.

```toml
[[tool.pdm.source]]
name = "fpho"
url = "https://files.pythonhosted.org/"
verify_ssl = false
```

그리고 다시 PDM으로 생성한 프로젝트에 라이브러리를 설치하면 문제가 해결되는 것을 볼 수 있습니다.

![](https://i.imgur.com/JBbxwAo.png){: w="800"}

### InsecureRequestWarning 제거하기

위 설정에서는 `verify_ssl = false`로 인해 `InsecureRequestWarning`이 발생할 수 있습니다. 이 경고 이름을 검색하면 대부분 아래와 같은 해결법을 제시합니다.

```python
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

특정 파이썬 코드나 모듈을 실행했을 때 `InsecureRequestWarning`이 발생했다면 위 코드로도 해결이 가능하지만 저처럼 PDM이나 Poetry를 사용할 때 문제가 발생한 경우에는 해결이 되지 않습니다. 결국 해당 경고를 뱉어내는 파일을 찾아 경고 메시지가 뜨지 않도록 하는 코드 한 줄을 추가하였습니다.

우선 위 경고가 발생하도록 하는 파일은 `urllib3` 라이브러리의 `connectionpool.py` 입니다. 이 파일을 열어 아래 한 줄을 추가하면 문제는 해결됩니다.

```python
warnings.simplefilter("ignore", InsecureRequestWarning)
```