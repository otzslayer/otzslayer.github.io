---
title: Git Hook을 이용해 코드 포맷팅 체크와 커밋 메시지 검증하기
tags: [git, hook, black, pre-commit, clean-code, code-formatting]
category: Git
layout: post
---



<!--more-->

## 들어가며

여러 사람과의 버전 관리를 위해 Git을 사용하다 보면 많은 문제가 생기기 마련입니다.
그중에서도 서로 다른 컨벤션, 특히 커밋 메시지 때문에 생기는 문제는 간단하게 해결하기 쉽지만 귀찮은 마음에 넘어가기 쉽습니다.
처음엔 괜찮아도 몇 번의 커밋이 쌓이기 시작하면 너무 먼 길을 왔다는 생각에 이도 저도 아니게 되는 경우도 더러 있는 듯합니다.
본 포스트에서는 Git Hook을 이용해서 커밋 전 코드 포매팅을 체크하고 커밋 메시지를 정해진 양식에 맞춰 작성했는지 자동으로 확인하는 방법을 소개하려고 합니다.

Git Hook은 Git 저장소에서 특정 이벤트가 발생할 때마다 자동으로 실행하는 스크립트를 말합니다.
이를 이용해 많은 귀찮은 작업을 자동으로 수행할 수 있습니다.
여러 Git Hook이 있지만, 이번 포스트에선 커밋 전과 커밋 메시지 작성 시 실행하는 스크립트인 `pre-commit`과 `commit-msg`를 이용해보겠습니다.

## Git Hook은 어디에 있지?

Git Hook은 모든 Git Repository에서 지원합니다.
터미널을 이용해 Git Repository를 들어가서 `.git/hooks` 폴더를 확인하면 다음과 같은 샘플 파일들이 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-01-13-check-code-format-and-commit-msg-using-git-hook/git_hook_samples.png" alt="Git Hook Samples" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">Git Hook 샘플 파일들</figcaption>
  </figure>
</center>

특정 이벤트에 따른 샘플 Hook들이 있고, 확장자인 `.sample`만 지워주면 바로 사용할 수 있게 됩니다.

## 코드 포맷팅 체크 (`pre-commit`)

### `black`

여러 사람이 동일한 컨벤션으로 코드를 작성하기란 쉽지 않습니다.
이럴 대 코드 포매팅 도구를 사용해서 코드 스타일을 통일시키면 굉장히 편하게 여러 사람의 코드에서 일관성을 확보할 수 있습니다.
코드 포매팅 도구 중 최근 많이 쓰이는 것은 [`black`](https://github.com/psf/black)으로 PEP8에 기반을 둔 코드 포매팅 도구입니다.
다음의 명령어를 통해 설치하도록 하겠습니다.

```bash
$ pip install black
```

### Hook 적용

커밋 전 적용할 Hook의 경우 `pre-commit`를 설치해 YAML 파일을 통해 간단하게 생성할 수 있습니다.
우선 `pip`를 이용해 `pre-commit`을 설치해줍니다.

```bash
$ pip install pre-commit
```

올바르게 설치를 했다면 Git Repository 폴더에서 다음의 명렁어를 실행해 환경설정 샘플 YAML 파일을 생성합니다.

```bash
$ pre-commit sample-config > .pre-commit-config.yaml
```

안에 내용은 당연히 샘플로 들어가 있기 때문에 `black`을 사용하도록 수정해야 합니다.
기존 파일을 다음 내용으로 덮어 씌웁니다.

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: stable
    hooks:
      - id: black
        args: [--line-length=80]
```

여기까지 됐다면 `pre-commit install`을 통해 설치합니다.
그리고 `git commit`을 하면 다음과 같이 적용된 것을 확인할 수 있습니다.

<center>
  <figure>
    <img src="/assets/images/2022-01-13-check-code-format-and-commit-msg-using-git-hook/git_commit.png" alt="After git commit" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;"><code>pre-commit</code>이 올바르게 적용되었을 때</figcaption>
  </figure>
</center>

간혹 다음의 주의 메시지가 출력되는 경우가 있습니다.

```
[WARNING] The 'rev' field of repo 'https://github.com/psf/black' appears to be a mutable reference (moving tag / branch).
Mutable references are never updated after first install and are not supported.
See https://pre-commit.com/#using-the-latest-version-for-a-repository for more details.
Hint: `pre-commit autoupdate` often fixes this.
```

`black` 모듈의 버전 정보가 `stable`로 되어 있을 때 발생하는데, 터미널에서 간단하게 `pre-commit autoupdate`를 실행해서 버전 정보를 업데이트 해주면 됩니다.
업데이트하게 되면 다음과 같이 수정이 됩니다.

```yaml
repos:
  - repo: https://github.com/psf/black
    rev: 21.12b0
    hooks:
      - id: black
        args: [--line-length=80]
```

## 커밋 메시지 검증 (`commit-msg`)

### 좋은 커밋 메시지

좋은 커밋 메시지에 대한 좋은 글들은 이미 많습니다.
저의 모자란 글솜씨 대신 링크로 대신하겠습니다.

- [좋은 git 커밋 메시지를 작성하기 위한 7가지 약속](https://meetup.toast.com/posts/106)
- [커밋 메시지 가이드 by Romulo Oliveira](https://github.com/RomuloOliveira/commit-messages-guide/blob/master/README_ko-KR.md)

### 커밋 메시지 템플릿

우선 사용할 커밋 메시지 템플릿을 정해야 하는데요.
구글에 검색하면 가장 많이 나오는 형태의 템플릿을 예로 들겠습니다.

```text
# <type>: <subject>
##### Subject 50 characters ################# -> |


# Body Message
######## Body 72 characters ####################################### -> |

# Issue Tracker Number or URL

# --- COMMIT END ---
# Type can be
#   feat    : new feature
#   fix     : bug fix
#   refactor: refactoring production code
#   style   : formatting, missing semi colons, etc; no code change
#   docs    : changes to documentation
#   test    : adding or refactoring tests
#             no productin code change
#   chore   : updating grunt tasks etc
#             no production code change
# ------------------
# Commit rules:
#   Capitalize the subject line
#   Use the imperative mood in the subject line
#   Do not end the subject line with a period
#   Separate subject from body with a blank line
#   Use the body to explain what and why vs. how
#   Can use multiple lines with "-" for bullet points in body
# ------------------
```
해당 내용이 담긴 파일을 `.gitmessage` 라는 이름으로 현재 Repository 안에 있는 `.git` 폴더 안에 넣어줍니다.
그리고 Git 설정값중 커밋 템플릿을 해당 파일로 설정합니다.

```bash
$ git config --local commit.template .git/.gitmessage
```

### Hook 적용

우선 어떤 형태로 Hook을 적용했는지 알아보도록 하겠습니다.
제가 사용한 방식은 커밋 메시지를 Python으로 읽어서 여러 커밋 메시지 규칙에 부합하는지 확인하여 오류 여부를 체크하는 형태입니다.
커밋 메시지 규칙을 체크하는 Python 파일을 실행하는 스크립트를 `commit-msg`에 저장하면 됩니다.

우선 제가 작성한 커밋 메시지 검증 코드는 아래와 같습니다.

{% highlight python linenos %}
#!/usr/bin/python3

import re
import sys

type_list = [
    "feat",
    "fix",
    "refactor",
    "style",
    "docs",
    "test",
    "chore",
    "ci",
    "perf",
]
type_regex = (
    r"^(feat|fix|refactor|style|docs|test|chore|ci|perf)(\(.+\))?\:\s(.{3,})"
)


class bcolors:
    FAIL = "\033[91m"
    ENDC = "\033[0m"


def verify_commit_message():
    with open(sys.argv[1]) as commit:
        lines = commit.readlines()

        # Remove comments
        lines = [line for line in lines if not line.startswith("#")]

        # If the last line is whitespace, remove it
        while lines[-1] == "\n":
            lines = lines[:-1]
            if len(lines) == 0:
                break

        # Empty commit message
        if len(lines) == 0:
            sys.stderr.write(
                f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}Empty commit message.\n"
            )
            sys.exit(1)
        # Subject line should be less than 50 characters.
        if len(lines[0]) > 50:
            sys.stderr.write(
                f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}Subject line should be less than 50 characters.\n"
            )
            sys.exit(1)
        # Subject line should follow the rule.
        if re.match(f"({type_regex})", lines[0]) is None:
            sys.stderr.write(
                f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}The commit message subject line does not follow the rule."
            )
            sys.stderr.write("\n<type>: <subject> is required.\n")
            sys.exit(1)
        # The subject should be a title-case.
        if not lines[0].split(":")[1].strip()[0].istitle():
            sys.stderr.write(
                f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}The subject should be title-cased.\n"
            )
            sys.exit(1)
        # If commit message has single line, description might be missing.
        if len(lines) == 1:
            sys.stderr.write(
                f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}Descriptions are missing.\n"
            )
            sys.exit(1)
        # After subject line, line space is required.
        if lines[1] != "\n":
            sys.stderr.write(
                "\nThe line space after the subject line is required.\n"
            )
            sys.exit(1)
        for line in lines[2:]:
            # Every single description should be less than 72 characters.
            if len(line) > 72:
                sys.stderr.write(
                    "\nEvery single description should be less than 72 characters.\n"
                )
                sys.exit(1)
            # Description starts with "-".
            if not line.startswith("-"):
                sys.stderr.write(line)
                sys.stderr.write(
                    f"\n{bcolors.FAIL} Commit failed: {bcolors.ENDC}Description should start with a dash '-'.\n"
                )
                sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    verify_commit_message()
{% endhighlight %}

파일명은 `verify_commit_msg.py`로 해당 파일은 `.git/hooks` 폴더에 위치합니다.

이제 여기에 `commit-msg` 스크립트 파일을 아래와 같이 작성해서 동일한 `.git/hooks` 폴더에 넣어놓으면 됩니다.

```bash
#!/bin/sh

exec < /dev/tty
./.git/hooks/verify_commit_msg.py $1
```

여기까지 잘 따라오셨다면 이제 `git commit`을 통해 잘못된 커밋 메시지를 입력해보셔서 테스트 하시면 됩니다.
아래 이미지는 커밋 제목이 Title-cased가 아니여서 실패한 케이스입니다.

<center>
  <figure>
    <img src="/assets/images/2022-01-13-check-code-format-and-commit-msg-using-git-hook/commit_failed.png" alt="Commit failed" style="zoom:50%;" loading="lazy" />
    <figcaption style="text-align: center;">잘못된 커밋 메시지를 입력하였을 때</figcaption>
  </figure>
</center>

## 마치며

이렇게 한 번 잘 설정해놓으면 커밋 메시지의 퀄리티에 대해 신경을 크게 쓰지도 않아 매우 편합니다.
게다가 나중에 다른 Git Repository를 작업하더라도 위에서 생성한 파일들만 그대로 넣어놓으면 바로 사용할 수도 있구요.
사소하다 생각해서 매번 놓치는 부분일 수도 있지만 사소한 것에서 큰 차이가 난다는 말도 있으니까요. 한 번 시도해보시는건 어떨까요? 😃