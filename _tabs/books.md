---
# the default layout is 'page'
icon: fas fa-book
order: 5

layout: books
books:
  - title: "인사이드 머신러닝 인터뷰"
    author: 펑 샤오
    link: "https://product.kyobobook.co.kr/detail/S000212624913"
    thumbnail: "https://i.imgur.com/kfkCmpO.png"
    reviewed_at: Jan 12, 2025 
    rating: 4
    description:
      - 꽤 기본적인 부분에서부터 심화적인 내용까지 ML/AI와 관련된 일을 하고 있는 사람이라면 반드시 알아야 하는 내용을 다루고 있음. 
      - 이미 잘 알고 있는 내용이더라도 다시 체크할 수 있는 체크리스트로도 쓸 수 있고, 순수 인터뷰 준비용으로도 쓸 수 있을 것 같음.
      - 레퍼런스가 굉장히 많아 관련 분야의 지식을 쌓기 좋으나 인터뷰 준비용 서적이기 때문에 레퍼런스에 대한 더 자세한 내용은 직접 찾아가면서 공부해야 함
      - 번역에 아쉬운 부분이 꽤 있는데, 영어 원어를 기재했다면 책을 읽기 훨씬 좋았을 것 같음. 읽다가 걸리는 부분이 꽤 많았음.
      - 책 내용이 매우 좋아서 개인적으로는 시스템 설계 파트가 두 개밖에 없다는 것이 아쉽게 느껴짐.
  - title: "랭체인으로 실현하는 LLM 아키텍처"
    author: 조대협
    link: "https://product.kyobobook.co.kr/detail/S000213921986"
    thumbnail: "https://i.imgur.com/NPZWvc6.png"
    reviewed_at: Jan 12, 2025 
    rating: 3
    description:
      - 기본적인 LLM API 사용법과 Langchain 사용법을 익힐 수 있는 책.
      - 책의 내용과 예제 모두 좋지만 아래 내용을 반드시 참고해야 함.
      - 예제에서 사용하는 일부 데이터는 저자의 블로그에서 검색하여 찾아야 함. 이에 대한 아무런 가이드가 없어 헤맬 수 있음.
      - 간단한 에이전트까지 만들어볼 수 있는 예제가 수록되어 있으나 책 내의 예제는 모두 Langchain 옛날 버전(0.1.X)에 대응함.
      - 다행히 GitHub 저장소에 0.3.X 버전에 실행할 수 있는 코드가 업데이트되어 있으나 노트북 파일의 목차가 이상하게 정리되어 있음.
      - Langchain과 Langsmith의 업데이트 주기가 굉장히 잦다는 것을 감안하고 보아야 하는 책임.
  - title: "MLOps 구축 가이드북"
    author: 김남기
    link: "https://product.kyobobook.co.kr/detail/S000213921166"
    thumbnail: "https://i.imgur.com/TA5SNgN.png"
    reviewed_at: Jan 12, 2025 
    rating: 5
    description:
      - 책 두께에 걸맞는 방대한 내용을 순서대로 잘 다루고 있음.
      - <a href="https://youtu.be/Fj0MOkzCECA?si=asgDNGAufJWQgnc5">ifkakao 발표 내용</a>을 한 번 보고 읽어보면 더 좋을 듯.
      - MLOps를 공부하고 구현하는 사람들이라면 반드시 읽어봐야 하는 책이라고 생각함.
      - 기본적으로 Docker, airflow 등을 사용할 줄 알면 쉽게 읽을 수 있지만 아닌 경우엔 읽다가 멈칫하는 부분이 많을 수 있음.
      - MLOps 단계를 구분하여 구현하는 부분이 있는데 처음부터 모델을 학습하지 않고 기존에 있는 파일을 활용하기 때문에 MLOps 0단계와 1단계의 차이를 크게 느끼지 못할 수 있음.
      - 예제가 매우 잘 구성되어 있는 것도 좋은데 예제 이외의 볼거리가 참 많은 책임. 부록 내용도 꼭 읽어보길 권장함.
  - title: "테스트 주도 개발 입문"
    author: 살림 시디퀴
    link: "https://product.kyobobook.co.kr/detail/S000213558059"
    thumbnail: "https://i.imgur.com/AbBRJOK.png"
    reviewed_at: Jan 22, 2025 
    rating: 4
    description:
      - TDD를 Python 코드로 배울 수 있는 아주 귀중한 책
      - TDD에 대해서 아무 것도 모르고 보면 조금 당황할 수 있음. 본인도 TDD가 무엇인지 잘 모르고 보았는데, 색다른 접근 방법이라고 느꼈음.
      - 아무래도 요즘 <code>pytest</code>를 사용하는 경우가 많다보니 책에 있는 Python 테스트 코드가 모두 <code>unittest</code>로 작성되어 있어서 아쉬움. 직접 수정하여 예제 코드를 활용함. <code>pytest</code>를 쓰는 사람이라면 반드시 직접 바꿔보길 권장함.
      - 위 내용의 연장선으로 변수나 함수, 메서드명이 모두 <code>snake_case</code>가 아닌 <code>camelCase</code>로 되어 있어서 아쉬움.
      - 아무래도 폴리글랏을 표방하는 책이다보니 책 페이지 수 대비 내용이 방대하지 않음.
      - 다른 관련 책과 함께 공부하면 더 도움이 될 것 같음.
  - title: "소프트웨어 엔지니어 가이드북"
    author: 게르겔리 오로스
    link: https://product.kyobobook.co.kr/detail/S000214576874
    thumbnail: "https://i.imgur.com/yg2v9KF.png"
    reviewed_at: Feb, 8, 2025
    rating: 5
    description:
      - 어떤 직무든, 어떤 회사든 본인이 개발과 관련이 있다면 반드시 읽어야 하는 책
      - 신입 사원일 때, 주니어일 때, 시니어일 때, 리더십 위치일 때, 모든 상황에 따라 다르게 읽히고 새로운 인사이트를 제공하기 때문에 언제든지 본인의 상황이 바뀌었거나, 누군가의 조언이 필요할 때 한 번씩 꺼내서 읽어볼 만함.
      - 번역 품질도 훌륭해서 읽다가 걸리는 경우가 거의 없었음
      
---
