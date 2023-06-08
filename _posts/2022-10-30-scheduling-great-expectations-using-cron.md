---
title: Cron으로 Great Expectations 데이터 검증 스케줄링하기
tags: [great-expectations, mlops, scheduling, cron]
category: MLOps
aside:
  toc: true
show_category: true
---


<!--more-->

## 들어가며

이전 포스트에서 알아본 데이터 파이프라인 검증 프로세스를 수동으로 한다면 굳이 Great Expectations를 사용하는 의미가 없습니다. 그래서 스케줄링을 통해 검증 프로세스를 자동화하는데, Cron을 이용하거나 Airflow에 DAG를 만들어서 추가하는 식으로 자동화할 수 있습니다. 본 포스트에서는 가장 간단한 Cron을 이용한 방법을 소개하려고 합니다.

## 기존 검증 체크포인트 확인

우선 검증을 위한 체크포인트가 실행 가능한지 확인합니다.

```bash
great_expectations checkpoint run ge_guide
```

실행이 가능하다면 Cron을 통해 실행할 수 있도록 파이썬 스크립트로 변환합니다.

```bash
great_expectations checkpoint script ge_guide
```

명령이 올바르게 실행되었다면 다음과 같은 메시지가 출력됩니다.

```plain
Using v3 (Batch Request) API
A python script was created that runs the Checkpoint named: `ge_guide`
  - The script is located in `great_expectations/uncommitted/run_ge_guide.py`
  - The script can be run with `python great_expectations/uncommitted/run_ge_guide.py`
```

생성된 파이썬 스크립트의 내용은 다음과 같습니다.

```python
import sys

from great_expectations.checkpoint.types.checkpoint_result import CheckpointResult
from great_expectations.data_context import DataContext

data_context: DataContext = DataContext(
    context_root_dir="/Users/jayhan/Projects/great-expectations/great_expectations"
)

result: CheckpointResult = data_context.run_checkpoint(
    checkpoint_name="ge_guide",
    batch_request=None,
    run_name=None,
)

if not result["success"]:
    print("Validation failed!")
    sys.exit(1)

print("Validation succeeded!")
sys.exit(0)

```

## Cron 스케줄링 등록

이제 이 파이썬 스크립트를 실행하는 명령을 Cron 스케줄링에 등록만 해놓으면 됩니다. 터미널에 `crontab -e`를 입력하여 실행하면 Cron 파일을 수정할 수 있습니다. Cron에 스케줄링을 할 때는 다음과 같은 포맷을 이용합니다.

```bash
* * * * * {실행할 명령}
```

처음 다섯 개의 \*는 각각 분, 시간, 일, 월, 요일을 의미합니다.

| 필드 | 유효한 값의 형식   |
| :--- | :----------------- |
| 분   | 0-59               |
| 시간 | 0-23               |
| 일   | 1-31               |
| 월   | 1-12               |
| 요일 | 0-6(일요일-토요일) |

예를 들어 매월 1일 오전 9시 30분에 스케줄링한다면 이렇게 됩니다.

```
30 9 1 * * {실행할 명령}
```

그리고 모든 명령문은 절대경로를 사용해야 합니다. 그리고 `pwd`를 통해 Great Expectations를 작업한 폴더의 위치까지 알았다면 Cron 파일에 원하는 날짜, 시간으로 내용을 작성합니다.

```
30 9 1 * * path/to/python project_root_path/great_expectations/uncommitted/run_ge_guide.py
```

`path/to/python`에 파이썬 절대 경로, `project_root_path`에 `pwd`를 통해 얻은 작업 폴더 위치를 입력하고 Cron 파일을 저장하면 됩니다. 만약 체크포인트에서 수정해야 할 부분이 있다면 `project_root_path/great_expectations/checkpoints/ge_guide.yml` 에서 수정하면 됩니다. 예를 들어 검증할 파일명이 바뀌었다면 `validation -> batch-request -> data_asset_name`의 파일명을 수정하면 됩니다.

