---
title: Git Merge에서 Fast Forward 관계 이해하기
tags: [git, fast-forward]
category: Git
layout: post
---

Git Merge에서 항상 헷갈리는 Fast Forward 관계에 대해 정리해보았습니다. 🙌

<!--more-->

## 들어가며

Git을 사용하다보면 브랜치를 분기하여 다시 병합하는 일이 빈번하게 일어납니다. 최근 Git 커밋 히스토리 관리에 관심을 가지던 중, 머리 속에서 Fast Forward 관계에 대해 쉽게 정리가 되지 않더라구요. 그래서 지금이라도 확실하게 기억해둬야겠다 싶어 짧게나마 포스트를 작성하였습니다.



## Fast Forward 관계

이 관계는 **기존 브랜치와 분기한 브랜치의 관계**가 기준입니다. Fast Forward를 가장 쉽게 이해하는 방법은 **'분기한 브랜치의 커밋 히스토리가 기존 브랜치의 커밋 히스토리를 포함하고 있는가'**입니다. 

### Fast-Forward 일 때

<center>
  <figure>
    <img src='/assets/images/2021-12-05-git-merge-fast-forward/fast-forward.png'
    loading="lazy" 
    style="zoom:25%;">
    <figcaption style="text-align: center;">Fast-Forward인 경우</figcaption>
  </figure>
</center>

브랜치 B는 브랜치 A에서 분기하였습니다. 브랜치 B의 커밋 히스토리는 $A \to B \to X \to Y$로, 브랜치 A의 커밋 히스토리인 $A \to B$ 를 포함하고 있습니다. 이 경우에 **Fast Forward 관계**라고 합니다. Fast Forward 관계일 때는 별다른 옵션을 주지 않고 병합을 하게 되면 Merge commit은 만들어지지 않고 `HEAD`의 위치만 변하게 됩니다. 병합은 단순하게 `git merge {병합할 브랜치명}` 으로 수행합니다.

<center>
  <figure>
    <img src='/assets/images/2021-12-05-git-merge-fast-forward/ff-merge.png'
    loading="lazy" 
    style="zoom:25%;">
    <figcaption style="text-align: center;">병합하면 브랜치를 따라가게 됩니다.</figcaption>
  </figure>
</center>


### Fast-Forward 관계가 아닐 때

<center>
  <figure>
    <img src='/assets/images/2021-12-05-git-merge-fast-forward/non-fast-forward.png'
    loading="lazy" 
    style="zoom:25%;">
    <figcaption style="text-align: center;">Fast-Forward가 아닌 경우</figcaption>
  </figure>
</center>


이번에도 브랜치 B는 브랜치 A에서 분기하였습니다. 하지만 브랜치 A의 커밋 히스토리는 $A \to B \to C$ 로 브랜치 B의 커밋 히스토리가 이를 포함하지 못하고 있습니다. 이 경우엔 Fast Forward 관계가 아니며, `git merge`를 하는 경우 충돌(conflict)이 발생하게 됩니다. 이 경우에 병합하게 되면 반드시 Merge commit이 생성됩니다. 또한 `HEAD` 를 따라가는 것이 아니라 브랜치가 실제로 병합됩니다. 병합은 `git merge --no-ff {병합할 브랜치명}` 을 통해 수행합니다.

<center>
  <figure>
    <img src='/assets/images/2021-12-05-git-merge-fast-forward/no-ff-merge.png'
    loading="lazy" 
    style="zoom:25%;">
    <figcaption style="text-align: center;">Merge commit을 생성하며 병합됩니다.</figcaption>
  </figure>
</center>

## 마무리

최근 블라인드에서 빅테크들의 트렌드는 Rebase를 통해 커밋 히스토리를 복잡하지 않게 관리하는 것이라는 글을 보았습니다. 이렇게 정리해놓고 보니 제대로 커밋 히스토리를 관리하려면 `--no-ff` 옵션을 활용해야 할 것 같다는 생각이 들었습니다. 단순하게 관리하기 위해선 누가 어떻게 작업했고, 어디서 병합이 이루어졌는지를 알아야 할텐데, Fast Forward 관계가 되어서 병합을 하였을 때 어디에서 병합되었는지 기록이 남지 않게 되면 나중에 작업 내용을 추적하기 어려울 것 같습니다. 더욱이 여러 명이 함께 작업하게 되면 각자의 작업 내용을 기록하기 위해서라도 `--no-ff`로 병합을 하는 것이 적절해보입니다.

