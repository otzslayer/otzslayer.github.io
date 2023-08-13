---
title: 블로그에 View Counts 달기
layout: post
tags: [notes, jeykll, view-counts]
category: etc
image:
  path: https://i.imgur.com/ilzcEHC.png
  alt: 
---

## 들어가며

Jekyll로 블로그를 만들면서 항상 아쉬웠던 요소는 자체적으로 조회 수를 세는 기능이 없다는 것입니다. 티스토리는 자체적으로 해당 기능을 제공하고 있는 것을 보면 항상 부러웠죠. 물론 Google Analytics를 통해 정확한 조회 수를 확인할 수는 있습니다만 블로그 자체에서 해당 기능이 있으면 매우 좋겠다 생각했습니다. 그러던 중 [어떤 블로그의 포스트](https://searching-fundamental.tistory.com/52)를 발견하였습니다.

![](https://i.imgur.com/5iSeUZb.png){: w="600"}

글을 쭉 읽어보니 생각보다 간단하게 만들 수 있는 기능이라서 이번에 한 번 시도해보았습니다.

## 조회 수 뱃지 달기

[HITS 페이지](https://hits.seeyoufarm.com/)에 접속하면 바로 뱃지를 생성할 수 있습니다.

### 뱃지 커스터마이징

![](https://i.imgur.com/SHU2jsr.png)

우선 메인 페이지의 사이드바에 뱃지를 달기로 결정했기 때문에 블로그의 메인 주소를 입력했습니다. 그리고 아래 옵션에서 원하는대로 뱃지를 커스터마이징할 수 있습니다. 전 그래파이트 색상을 좋아하기 때문에 다음과 같이 만들었습니다.

![](https://i.imgur.com/R7TjVms.png){: w="150"}

커스터마이징을 끝냈으면 아래에 다음과 같이 뱃지를 삽입할 수 있는 여러 코드 스니펫을 제공하는데 그 중에서 `HTML LINK` 를 사용하겠습니다.

![](https://i.imgur.com/Hr3XIei.png){: w="600"}

### 메인 페이지 사이드바에 뱃지 달기

저는 [Chirpy 테마를 사용](https://otzslayer.github.io/%EC%9E%A1%EB%8B%B4/2023/06/09/reintroduce-my-blog.html)하고 있기 때문에 해당 테마 기준으로 설명하도록 하겠습니다. 우선 사이드바에 달아야하기 때문에 `_includes/sidebar.html` 을 수정하였습니다.

뱃지의 위치는 사이드바의 여러 버튼 바로 위이기 때문에 적당한 마진값을 줘서 관련 버튼 코드 위에 다음과 같이 HTML 코드를 삽입하였습니다.

```html
<!-- View counts -->
<div class="align-items-center w-100" style="text-align: center; margin-bottom: 1rem;">
  <img src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fotzslayer.github.io&count_bg=%23555555&title_bg=%23242424&icon=myspace.svg&icon_color=%23E7E7E7&title=Visitors&edge_flat=false"/>
</div>
```

그 결과는 아래와 같습니다.

![](https://i.imgur.com/KFhx9dM.png) {: w="800"}

### 각 포스트에도 뱃지 달기

사이드바는 매우 간단했는데 문제는 각 포스트에 다는 일이었습니다. 사실 어려운 일은 아닌게 각 URL은 Liquid 문법으로 가져올 수 있기 때문입니다. 저는 모든 포스트에서 상단 애드센스 광고 바로 아래에 달고 싶었기 때문에 해당 위치에 다음과 같이 코드를 삽입했습니다. 포스트 레이아웃 경로는 `_layouts/post.html` 입니다.

```html
<!-- View counts -->

{% capture url %} https://{{ site.url | remove_first: 'https://' | remove_first: 'http://' }}{{ page.url }}
{% endcapture %}
{% capture view_img_url %}
https://hits.seeyoufarm.com/api/count/incr/badge.svg?url={{url}}&count_bg=%233A3A3A&title_bg=%23111111&icon=myspace.svg&icon_color=%23E7E7E7&title=Views&edge_flat=false
{% endcapture %}
{% assign view_img_url = view_img_url | remove: " " %}

<div class="align-items-center w-100" style="text-align: center; margin-bottom: 1rem;">
	<img src="{{view_img_url}}" />
</div>
```

이렇게 코드를 짠 이유는 `url` 앞뒤로 공백이 생겼기 때문입니다. 처음에는 아래에 `img src`에 `view_img_url`을 통째로 넣었었는데 앞뒤 공백으로 인해 올바른 주소를 받아올 수 없었습니다. 하는 수 없이 `view_img_url`을 캡쳐한 다음에 공백을 모두 제거하는 방식으로 올바른 주소를 생성해 이미지를 불러왔습니다. 그 결과는 아래와 같습니다.

![](https://i.imgur.com/TsaHNcO.png){: w="600"}

## 나가며

조금 아쉬운 점은 원래 그런지 모르겠으나 처음 페이지를 들어갔을 때 뱃지의 숫자가 제때 올라가지 않는다는 것입니다. 다행히 다시 해당 페이지를 들어가면 이전 페이지의 접속에 따른 뱃지 숫자가 올라간 상태로 보입니다.

그리고 또 아쉬운 점이 하나 있는데 같은 사용자를 인식하지 못하고 단순히 해당 페이지를 불러오는 것만으로 숫자가 올라간다는 점입니다. 그러다보니 메인 페이지의 사이드바에 있는 뱃지는 숫자가 매우 금방 올라가는 문제가 있습니다. 기분은 뭔가 좋은데 정확한 수치는 아니라 아쉬움이 있습니다.

이런 점만 제외하고는 그래도 만족스러운 결과물입니다. 이 글을 보는 분들께서도 Jekyll 블로그에 조회 수 기능을 붙이고 싶을 때 간단하게 시도해보시는 것도 좋을 것 같습니다.