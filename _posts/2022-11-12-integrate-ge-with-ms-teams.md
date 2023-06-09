---
title: Great Expectation 결과 MS Teams로 보내기
tags: [great-expectations, mlops, ms-teams]
category: MLOps
layout: post
---


<!--more-->

검증을 스케줄링하여 자동화했지만 해당 작업이 종료했다는 알림을 받는 것도 매우 중요합니다. Great Expectations에서는 이런 알림 푸시를 다양한 방법으로 제공합니다. 본 챕터에서는 작업 완료 알림을 MS Teams 채널로 받는 방법에 대해 알아봅니다.

가장 먼저 MS Teams에서 Great Expectations 알림을 받을 채널을 생성합니다. 그 다음 해당 채널에 마우스 오른쪽 버튼을 클릭하여 커넥터 메뉴로 들어갑니다.

<center>
<figure>
  <img src="/assets/images/2022-11-12-integrate-ge-with-ms-teams/ms_teams_1.png"
    alt="TITLE" style="zoom:33%;" loading="lazy"/>
</figure>
</center>

다양한 커넥터가 있는데 이 중에서 **Incoming Webhook**을 찾아 구성 버튼을 누릅니다. 

<center>
<figure>
  <img src="/assets/images/2022-11-12-integrate-ge-with-ms-teams/ms_teams_2.png"
    alt="TITLE" style="zoom:33%;" loading="lazy"/>
</figure>
</center>

원하는 대로 이름을 작성하여 만들기를 누르면 Webhook 주소가 생성되는데 이를 복사합니다. 다시 Great Expectations 폴더로 돌아가서 설정 변수 파일인 `uncommitted/config_variables.yml`을 실행합니다. 설정 파일 맨 마지막에 `validation_notification_teams_webhook`이란 변수를 다음과 같이 추가합니다.

```yaml
validation_notification_teams_webhook: 복사한 Webhook 주소
```
<center>
<figure>
  <img src="/assets/images/2022-11-12-integrate-ge-with-ms-teams/ms_teams_webhook_settings.png"
    alt="TITLE" style="zoom:33%;" loading="lazy"/>
</figure>
</center>

그 다음 프로젝트 폴더 하위에 있는 `great_expectations/checkpoints/ge_guide.yml` 파일을 실행합니다. 해당 파일은 데이터 검증을 위한 체크포인트의 설정 변수 파일입니다. 내용 가운데에 `action_list` 아래에 다음의 내용을 추가합니다.

```yaml
- name: send_teams_notification_on_validation_result
  action:
    class_name: MicrosoftTeamsNotificationAction
    microsoft_teams_webhook: ${validation_notification_teams_webhook}
    notify_on: all   # possible values: "all", "failure", "success"
    renderer:
      module_name: great_expectations.render.renderer.microsoft_teams_renderer
      class_name: MicrosoftTeamsRenderer
```

<center>
<figure>
  <img src="/assets/images/2022-11-12-integrate-ge-with-ms-teams/ms_teams_ckpt_settings.png"
    alt="TITLE" style="zoom:33%;" loading="lazy"/>
</figure>
</center>

이제 설정이 올바르게 구성되었는지 확인을 위해 프로젝트 폴더에서 터미널에 다음 명령어를 실행합니다.

```bash
great_expectations project check-config
```

올바르게 구성되어 있다면 다음의 메시지가 출력됩니다. 오류가 발생한 경우 설정 내용의 들여쓰기나 오타 등을 확인하시기 바랍니다.

 ```
 Using v3 (Batch Request) API
 Checking your config files for validity...
 
 Your config file appears valid!
 ```

마지막으로 체크포인트를 실행하면 MS Teams 채널에 Great Expectations 알림이 올바르게 전송되는 것을 확인할 수 있습니다.

<center>
<figure>
    <img src="/assets/images/2022-11-12-integrate-ge-with-ms-teams/ms_teams_noti.png"
      alt="TITLE" style="zoom:50%;" loading="lazy"/>
</figure>
</center>

