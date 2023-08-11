---
title: Git merge에서 발생하는 충돌 해결하기
layout: post
tags: [git, merge, conflict-resolving]
category: Git
image:
  path: https://i.imgur.com/zKykbkJ.png
  alt: Image from [here](https://paautism.org/resource/conflict-resolution-relationships/)
---

## 예시

![](https://i.imgur.com/xEVTGd6.png){: w="600"}

위와 같은 상황이라고 가정해봅시다. `main` 브랜치에는 `file.txt` 라는 파일이 관리되고 있고 커밋 B에는 다음의 내용이 있습니다.

```
Commit A
Commit B
```

그리고 `main`로부터 분기한 `branch1`과 `branch2` 에는 커밋 B에 추가적으로 다음의 내용이 각각 들어가 있습니다.

```
Commit A
Commit B
Add line for branch1
```

```
Commit A
Commit B
Add line for branch2
```

우선 `branch1`을 `main` 브랜치로 병합했다고 가정하겠습니다.

```bash
git checkout main
git merge branch1
```

그러면 당연히 `branch1`의 내용이 병합되어 `HEAD`는 커밋 C를 바라보게 됩니다.

![](https://i.imgur.com/Pp2rcSU.png){: w="600"}

### 에러 발생

그 다음 `branch2`를 `main` 브랜치에 병합을 하고자 했지만 다음과 같은 오류가 발생합니다.

```bash
git merge branch2
Auto-merging file.txt
CONFLICT (content): Merge conflict in file.txt
Automatic merge failed; fix conflicts and then commit the result.
```

병합 도중 충돌이 발생하였는데요. `file.txt`에서 세 번째 줄에 서로 다른 내용이 들어있어서 발생하는 충돌입니다. `file.txt`를 열면 다음과 같이 내용이 수정되어 있습니다.

```
Commit A
Commit B
<<<<<<< HEAD
Add line for branch1
=======
Add line for branch2
>>>>>>> branch2
```

이 상태에서 무언가 작업하기 위해서 `branch2`로 이동하려고 하면 또 다음과 같은 오류가 발생합니다.

```bash
git checkout branch2
file.txt: needs merge
error: you need to resolve your current index first
```

병합 시 발생한 충돌을 해결하지 않고 브랜치를 이동하면서 발생하는 오류입니다. 해결법은 당연히 충돌을 해결하는 것인데요. 지금 당장 충돌을 해결하지 않는다면 다음과 같은 방법이 있습니다.

```bash
git reset --merge
```

현재 병합하고 있는 작업을 리셋하여 **없던 일**로 바꿔놓는 것이죠. 그리고 다시 `branch2`로 이동하려고 하면 다행히 이동이 됩니다.

### 충돌 해결하기

하지만 근본적인 문제를 해결하지 않으면 안되겠죠. `file.txt`를 열고 충돌이 난 부분을 다음과 같이 수정합니다.

```
Commit A
Commit B
Add line for branch1
Add line for branch2
```

그 다음 `git status`로 현 상황을 보면 다음과 같은 메시지가 출력됩니다.

```
On branch main
You have unmerged paths.
  (fix conflicts and run "git commit")
  (use "git merge --abort" to abort the merge)

Unmerged paths:
  (use "git add <file>..." to mark resolution)
	both modified:   file.txt

no changes added to commit (use "git add" and/or "git commit -a")
```

이제 충돌을 해결했으므로 `file.txt`를 다시 커밋합니다.

```bash
git add file.txt
git commit -m "충돌 해결"
```

그러면 문제 없이 병합에 성공하며 그래프는 다음과 같은 형태를 띄게 됩니다.

![](https://i.imgur.com/g2jesI0.png){: w="600"}