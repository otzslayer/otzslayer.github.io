# 프로젝트 지침

## Git 워크플로

이 저장소에서는 새 브랜치를 만들지 않고 `master` 브랜치에서 바로 작업합니다. 커밋과 푸시도 `master`에 바로 합니다.

예외: 디자인 개편(이슈 #17)과 그 티켓 작업은 `feat/blog-redesign` 브랜치에서 하고 `master`에는 직접 커밋하지 않습니다. 구현이 모두 끝나면 `master`에 한 번에 병합합니다. 병합한 뒤에는 이 예외 문단을 지웁니다.

## Agent skills

### Issue tracker

이슈와 스펙은 GitHub Issues(`otzslayer/otzslayer.github.io`)에서 관리합니다. See `docs/agents/issue-tracker.md`.

### Triage labels

기본 라벨 다섯 개(`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)를 씁니다. See `docs/agents/triage-labels.md`.

### Domain docs

single-context: 최상위의 `GLOSSARY.md`와 `docs/adr/`. See `docs/agents/domain.md`.
