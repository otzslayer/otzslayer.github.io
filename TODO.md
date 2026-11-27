# TODO

## 디자인 개편(#17)

- [ ] 헤딩 라벨 칩의 레벨별 색 여섯 가지(`_sass/components/_heading-labels.scss`)를 기준색 구조에 맞출지 결정 (#18에서 보류)
- [ ] 페이지 파일에 하드코딩된 회색 정리. #23~#24에서 `_archives.scss`, `_categories.scss`, `_category-tag.scss`, `_tags.scss`를 지워 그 파일의 회색은 없어짐. 남은 곳: `_placeholders.scss`의 `%img-caption` 등, `_search.scss`, `_home.scss`의 페이지 이동 비활성 색, `_base.scss`, `_typography.scss`
- [ ] 375px에서 "Matt Pocock의 Engineering Skills를 사용하는 이유" 글의 560px 폭 iframe 임베드가 가로 스크롤을 만듦. 글 내용 문제라 #22 범위 밖
- [ ] 홈 목록에서 고정 글(pin) 표시를 없앰. 지금 고정 글은 없음. 나중에 쓰게 되면 표시 방식을 정해야 함 (#25)
- [ ] 패널의 최근 수정 글과 인기 태그를 모든 페이지에서 없앰 (#22). 다른 곳에 다시 둘지 결정
- [ ] `npm test`의 기존 eslint 오류 2건 (`clap-counts.js`의 `apiUrl` 미정의)
- [ ] `tools/test.sh`의 기존 html-proofer 실패 71건 (이미지 `alt` 누락 64건, HTTP 링크 6건, 잘못된 URL 1건)
- [x] 768px 미만에서 햄버거 메뉴를 연 채 검색하면 메뉴가 첫 검색 결과를 가림. 결과를 메뉴 아래로 내리기로 함 (#19)
- [x] 모바일 검색을 끝내려면 입력을 지워야 함. Cancel 버튼은 되살리지 않기로 함 (#19)
- [x] `#search-hints`(인기 태그)를 #19에서 숨김. 숨긴 채로 두기로 함
- [ ] 접히는 기준점 768px이 `_topbar.scss`의 `$collapse-bp`와 `_search.scss`의 `bp.md`에 따로 있음. 한 변수로 합칠지 검토
- [ ] 테마 파일의 `/* Sidebar */` 묶음에 남은 `--sidebar-bg`, `--sidebar-btn-bg` 이름 정리 (#18 기준색 정리와 함께)
- [ ] 구문 강조 `.highlight .gr` 글씨 `#f2efe9`가 코드 배경 `#f6f6f6`과 대비 1.06:1이라 거의 안 보임. 변경 전에도 1.01:1. 구문 강조 색은 #17 범위 밖 (#29)
- [ ] 구문 강조에 남은 따뜻한 회색 리터럴(`#3f3b35`, `#6e675e`, `#f2efe9`)이 무채색 흰 배경과 색조가 약간 어긋남 (#29)
- [ ] `_includes/head.html`의 라이트 `<meta name="theme-color">`가 `#f7f7f7`이라 새 배경 `#ffffff`와 다름 (#29)
- [ ] `_light.scss` 머리 주석이 기준색을 "배경, 글씨, 하이라이트"로 적지만 리터럴 이름은 `--link-color` (#29)
- [ ] Categories 목록 페이지를 지운 뒤 남은 JS: `_javascript/categories.js`, `rollup.config.js`의 `build('categories')`, `assets/js/dist/categories.min.js`, `_javascript/modules/components/category-collapse.js`. 지우려면 JS 번들을 다시 빌드해야 함 (#30)
- [ ] `_data/locales/*.yml`의 `tabs.categories`와 `categories:` 키를 더 쓰지 않음 (#30)
- [ ] 클래식 15px 스크롤바(Windows)에서는 1290~약 1305px 폭에서 ToC 패널이 약 7px 넘쳐 가로 스크롤이 생길 수 있음. 계산값이고 측정하지 못함 (#28)
- [ ] 1440px에서 맨 위로 버튼이 ToC 패널 열 안에 놓임. #28 이전부터 그랬음
- [ ] `home`, `commons`, `page`, `categories`, `misc` 번들에 쓰지 않는 `(min-width: 1200px)` 복사본이 남음. 다음 JS 빌드 때 없어짐 (#28)
- [ ] 768px 바로 위 폭에서 메뉴바와 본문 정렬선이 어긋남. `#topbar`는 화면 전체 폭 기준이고 본문은 컨테이너 안쪽 여백 안에 놓이기 때문. #31 완료 조건은 1440px만 봄
- [ ] `4309759`, `2c3188c` 커밋 본문의 일부 항목이 "한 항목에 한 사실" 규칙에 어긋남. 이미 만든 커밋이라 고치지 않음
- [ ] `_includes/search-loader.html`에 `px-1 px-sm-2 px-lg-4 px-xl-0`이 남아 검색 결과가 메뉴바 정렬선과 조금 어긋날 수 있음. 측정하지 않음 (리뷰 수정 91e0df3)
- [ ] 375px에서 일부 글의 본문 이미지(예: `cs224w-14`, `using-polars`)가 본문 열보다 넓어 좌우로 넘치고 페이지 가로 스크롤이 생김. 4b552a5에서도 같음. 측정값은 이미지 로드 시점에 따라 달라짐
