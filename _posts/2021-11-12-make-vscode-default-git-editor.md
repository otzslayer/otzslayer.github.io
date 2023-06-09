---
title: VS Code를 Git 기본 에디터로 설정하기
tags: [git, vs-code, setting-environment]
category: Git
layout: post
---

Make VS Code Great Again 👍

<!--more-->

## 들어가며

VS Code는 Git을 더 편하게 쓰게 해주는 확장 프로그램이 굉장히 많습니다. 소스트리나 별도의 툴을 설치하지 않아도 VS Code 하나만으로 제법 많은 일을 할 수 있습니다. 하지만 Git의 모든 기본 에디터는 내장되어 있는 Vim이나 GNU nano를 쓰게 됩니다. 이제 이 기본 에디터를 VS Code로 바꾸는 방법을 알아보도록 하겠습니다.

## 방법

### 준비 사항

문제를 해결하기 전에 준비해야 할 사항이 있습니다. VS Code가 `PATH`에 설정이 되어 있는지 확인해야 합니다. 커맨드라인에서 다음 명령이 실행되는지 우선 확인하셔야 합니다.

```bash
$ code --help
```

만약 오류가 발생한다면 VS Code 경로를 `PATH`에 넣어주셔야 합니다.

- 윈도우의 경우 최초 VS Code를 설치할 때 `PATH`에 추가할지 물어봅니다. 반드시 선택해주시구요.
- 맥의 경우 Command Palette에서 **Shell Command: Install ‘code’ command in PATH** 를 실행해주시면 됩니다.

`PATH` 설정까지 완료했다면 커맨드라인에 다음 명령을 실행하면 기본 에디터가 VS Code로 바뀝니다.

```bash
$ git config --global core.editor "code --wait"
```

### Commit Message

이후로 커밋을 하면 VS Code에서 커밋 메시지를 입력하게 되고, 메시지 입력 후 창을 닫으면 됩니다.

![Git commit message](/assets/images/2021-11-12-make-vscode-default-git-editor/git-commit-msg.png)

### Git Diff

`git diff` 는 현재 작업 중인 파일의 변경 내용을 보여줍니다. 아래 내용을 Git 환경 설정에 넣어주면 `git difftool` 명령어로 변경 내용을 VS Code로 확인할 수 있습니다. Git 환경 설정은 `git config -e` 로 가능합니다.

```bash
[diff]
	tool = default-difftool
[difftool]
	prompt = false
[difftool "default-difftool"]
	cmd = code --wait --diff $LOCAL $REMOTE
```

### Git Merge

Merge도 VS Code를 기본 툴로 사용할 수 있습니다.

```bash
[merge]
    tool = vscode
[mergetool "vscode"]
    cmd = code --wait $MERGED
```

## 만약 안된다면?

만약 VS Code Server에 연결을 실패하였다는 메시지가 뜬다면 VS Code Server를 제거한 후 Remote SSH로 다시 접속하여 VS Code Server를 재설치 해줍니다.

```bash
$ rm -rf /home/USER_NAME/.vscode-server
```