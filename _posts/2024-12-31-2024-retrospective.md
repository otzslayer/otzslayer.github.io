---
created: 2024-12-31
title: 2024 회고
layout: post
tags: [notes, retrospective]
category: 잡담
image:
  path: https://i.imgur.com/rzI6jRI.png
  alt: 
---

## 게으름과 바쁨, 그 사이

올해는 이번 회고를 제외하고 다섯 개의 글밖에 쓰지 못했습니다. 아무래도 여러 일이 겹쳐서 유달리 바빴던 한 해여서 어쩔 수 없었습니다. 우선 규모가 큰 1년짜리 프로젝트의 PL을 맡았습니다. 아래에서 더 돌아보겠지만 굉장히 바쁘고 신경 쓸 일이 많았습니다. 그리고 내년 결혼 준비 때문에 자투리 시간을 내기 어려웠습니다. 올해 여름엔 이사까지 가느라 정신을 차리기까지 제법 오랜 시간이 걸렸네요. 이렇게 큰 일이 많았다 보니 남는 모든 시간은 휴식을 취할 수밖에 없었습니다.

물론 변명이라고 할 수도 있긴 합니다. 작년에 작성한 포스트 수를 보니 46개더라고요. 올해보다 덜 바빴고, 강의 내용 요약이나 책 내용 정리처럼 시리즈로 구성하여 글 수가 많아질 수 있었다곤 하지만 심하게 차이 나는 것을 보고 생각이 많아졌습니다. 올해 바쁠 것은 알았지만 못해도 두 자릿수만큼은 쓰고 싶었는데 겨우 절반을 채웠네요. 바쁜 삶에서 오는 반작용으로 게으름을 부린 것이 아닌가 싶습니다.

내년에 결혼하고 나면 시간적 여유가 조금 있을 것 같지만 회사에서 조금 더 큰 역할을 맡게 될 것 같아서 여전히 블로그에 많은 신경을 쓰지 못할까 봐 걱정합니다. 아마 일이 많아지고 원하지 않을 일까지 하면서 더 바쁠 것 같습니다. 게다가 기술 역량 향상이 가능한 한 해가 될지도 잘 모르겠고요. 그래도 올해보다는 더 열심히 해보려고 합니다.

## 프로젝트 돌아보기

어떤 프로젝트를 진행했는지 밝히긴 어렵지만 올 한 해는 꽤 규모가 큰 프로젝트 하나에 1년을 꼬박 다 썼습니다. 그 프로젝트에서 ML 관련 파트의 PL을 맡으며 많은 경험을 했고, 내적으로 많은 성장을 했습니다. 많은 것을 배웠지만 기술적인 부분을 제외하고도 돌아볼 내용이 많아서 그 부분에 관해서만 이야기해 볼까 합니다.

### 사람이 제일 힘든 법

![](https://i.imgur.com/N4FAqWM.png){: w="600"}

저에게는 꽤 힘든 프로젝트였는데 무엇보다 업무 역량이 많이 떨어지는 프로젝트원이 있어 굉장히 많이 고민했었습니다. 프로젝트 업무를 거의 따라오지 못하는 수준이었는데, 결국은 그 사람을 탓하기보단 그 사람을 올바르게 알아보지 못한 HR의 역할에 대한 아쉬움이 매우 컸습니다. 안 그래도 개인적으로 최근 회사에서 채용에 관한 의구심이 커지고 있었는데, 그 의구심이 완벽한 불만으로 변모하는 계기가 되었습니다. 가장 힘들었던 건 업무 역량보다도 행동과 태도 문제를 더 심각하게 보고 있었는데 이런 문제는 멘토링으로 쉽게 바뀌지 않는 부분이었다는 점입니다. 업무 역량이 문제라면 계속 업무를 같이 하면서 바로잡을 수 있는 부분이 많은데, 행동과 태도는 어느새 제자리로 돌아오다 보니 아무런 의미가 없었습니다. 결국 1년 프로젝트의 절반만을 채우고 그 프로젝트원과는 같이 업무를 할 일이 없었는데, 그러더라도 몇 달간 계속 멘토링을 진행하였으나 모종의 일로 인해서 그분에 대한 멘토링을 자체적으로 끝내게 되었습니다. 

그런데 그분을 멘토링하면서 생겼던 가장 큰 문제는 저에 대한 오해가 생겨나고 있었다는 점입니다. 그분에 대한 심각한 사건 하나 때문에 매주 1:1 미팅을 진행했었는데요. 사안이 사안인 만큼 매번 서로가 심각한 표정으로 1:1 미팅을 했는데 주위에서 너무 쥐잡듯이 잡는 거 아니냐, 너무 단호하고 심하게 멘토링하는 게 아니냐는 얘기를 많이 들었었습니다. 조금 억울함이 있어서 해당 사건이 어떤 일이었는지 설명해 주고 나서야 이해를 받을 수 있었고, 이런 상황에 꽤 지쳐있는 상황입니다. 처음엔 한 명 한 명에게 모든 상황을 설명했었는데 이제는 포기했습니다. 해당 인원이 다른 프로젝트에서도 비슷한 행동을 하면서 모두가 상황을 알게 되는 상황이라서 굳이 제가 설명하지 않아도 되게 되었습니다. 아무튼 저에게는 굉장한 스트레스였지만 회사엔 얼마나 다양한 사람이 있는지, 그래서 다른 분들과의 멘토링을 어떻게 해야 하는지에 대한 깊은 생각을 하는 기회가 되었습니다. 

### 👉너? 👍잘한다!

![](https://i.imgur.com/OgMT2Ii.png)

프로젝트를 진행하면서 PMO와 고객으로부터 많은 인정을 받았는데 정작 왜 제가 그런 인정을 받았는지 모르는 상황이 있었습니다. 나중에 그 이유를 들을 수 있었는데, '같이 일하는 파트너사와의 협업을 잘 해줘서'였습니다. 사실 별다르게 한 것은 없지만 파트너사의 업무 태만에 가까운 수많은 행태를 큰 불평 없이 버텨가며 일한 덕분이었습니다. 제가 2024년 꽤 힘들었던 이유의 대부분이 바로 이 파트너사인데요. 해야 하는 일이라면 남이 하지 않더라도 반드시 해야 한다는 평소의 지론 덕분에 일이 잘 해결되었던 것 같습니다. 그 파트너사는 다시는 같이 일하기 싫은 곳이지만 다행히 같이 일할 일도 없을 것 같습니다. 이러나저러나 결국은 신뢰를 받아 가며 일해보는 재밌는 경험이 되었습니다.

### 좋은 협업에 대한 생각

![](https://i.imgur.com/UAimawj.png){: w="600"}

프로젝트 규모가 꽤 크다 보니 좋은 협업이란 무엇인가에 대해서 많은 생각을 할 수 있었습니다. 이 프로젝트를 관통할 수 있는 한 문장이 있습니다. 바로 '오는 말이 고와야 가는 말이 곱다'인데요. 같은 상황이라도 상대방을 존중하는 말과 행동이어야 함께 일하기 훨씬 편하다는 것을 깨달았습니다. 더욱이 무작정 본인이 편하기 위한 방법으로 협업해서는 안 된다는 생각을 갖게 되었습니다. 만약 제가 당장에 편해지자고 협업하고 있는 분들께 어떤 방식을 강요한다면, 당시엔 편할 수 있지만 상대방도 그게 내가 편하기 위해서라는 사실을 당연히 알고 있기에 괘씸하기 때문에라도 나중에 업보로 돌아올 수 있다고 생각했습니다.

일을 잘한다는 건 단순히 '개발을 잘한다', '문서를 잘 작성한다'가 아니었습니다. 규모가 큰 프로젝트일수록 다른 파트, 또는 파트 구성원과 잘 소통하고 협업하고, 편한 분위기를 이끌며 목표를 달성하는 사람이 일을 잘하는 것입니다. 이를 위해서는 항상 나의 감정과 내가 끝내야 하는 일에 대한 조급함을 앞세우지 않고 차분하게 상황을 바라볼 수 있는 자세가 필요하다는 것을 느꼈습니다.


## 조직의 큰 변화

사실 2024년은 일도 일이었지만 조직적으로도 큰 사건이 너무 많았습니다. 팀장 위의 리더십에서 비롯된 팀원의 강제 이동과 이에 따른 리더십 리스크를 겪었었는데요. 상위 리더십에서 비록 사업적인 성장이 우선인 회사라지만 매출이 나오는 특정 직무와 조직에 대한 편애가 너무 과해서 생긴 일이었습니다. 해당 조직을 밀어 주기 위해 스킬셋이 맞지 않는 구성원을 해당 조직으로 강제로 이동시키는 일이 있었는데, 이동을 강하게 거부하는 경우엔 거의 탄압당하듯 다른 조직으로 이동까지 하게 되었습니다.

아무래도 몇 해 동안 문제없이 굴러가던 조직과 직무의 케미스트리를 깡그리 무시한 채 사업 우선적 판단으로 조직을 굴리려다 보니 굉장히 삐걱거릴 수밖에 없었습니다. 많은 인원이 이탈하기도 했고요. 결국 여러 채널을 통해 해당 사건에 대한 부정적인 글과 의견이 많았는데 그럼에도 바뀌는 것은 하나도 없었습니다. 되려 이 일을 무마할 생각만 했던 것 같고, 부정적인 의견은 모두 피해받고 있는 조직의 리더로부터 시작됐다고 생각하는 듯했습니다. 

저에겐 정말 훌륭한 반면교사였습니다. 사업적 성장이 중요하더라도 돈도 사람이 버는 건데, 사람을 천대하면 어떻게 조직이 망가지는지 볼 수 있었습니다. 강제 이동했던 인원 중 일부는 과도한 스트레스로 질병 휴직을 했고, 다른 인원들도 여전히 스트레스 속에서 일을 하고 있다고 들었습니다. 더 큰 문제는 남아있는 인원들도 언제든 그 대상이 될 수 있다는 생각에 조직 이동이나 퇴사를 고려하고 있다는 점입니다. 내년에도 큰 변화가 없다면 저도 자발적인 조직 이동이나 이직을 고민해 볼 수밖에 없을 것 같습니다.


## 나가며

요즘 [소프트웨어 엔지니어 가이드북](https://product.kyobobook.co.kr/detail/S000214576874)이란 책을 읽고 있습니다. 한 페이지 한 페이지 읽을 때마다 평소에 했던 고민에 대한 답이 있고, 더 깊은 생각을 하도록 만들어줍니다. 매우 훌륭한 책이고, 기회가 된다면 매년 한 번씩은 정독해 봐도 좋지 않을까 싶습니다. 모두에게 추천해 주고 싶은 책이라서 나가는 글에 짧게 소개했습니다.

작년보다 더 다사다난했던 한 해가 끝나갑니다. 여러 사건 사고로 인해서 연말 같지 않은 침울한 분위기가 계속되고 있고, 이 슬픔이 해를 바꿔서도 이어질 것 같습니다. 모든 일들이 잘 해결되어서 늦게나마 행복한 연초가 되었으면 합니다.