---
created: 2024-07-10
title: 리눅스 systemd에 서비스 등록하기
layout: post
tags: [systemd, systemctl, fastapi]
category: etc
image:
  path: https://i.imgur.com/C8tvJQi.png
  alt: 
---

## 배경

최근 프로젝트에서 FastAPI를 이용해 API 서버를 띄우고 있는데 이 모든 과정이 수동이었습니다. 만약 서버를 중지했다가 재기동하는 경우 직접 명령어를 입력하거나 실행용 쉘 스크립트를 실행해서 API 서버를 다시 띄워야만 했습니다. 너무 번거로운 작업이라 API 서버 띄우는 작업을 리눅스 systemd에 등록하여 서비스화하였습니다. 아래 내용은 일련의 쉘 스크립트를 systemd에 등록하는 방법과 관련 명령어에 대해 다룹니다.

## systemd에 서비스 등록하기

### systemd란

![](https://i.imgur.com/JLlXV9w.png){: w="600"}

본격적인 내용에 앞서서 [systemd](https://systemd.io/)에 대해서 간략하게 설명하고자 합니다. systemd는 대부분의 리눅스 시스템에서 사용하고 있는 시스템 및 서비스 관리자입니다. systemd 에서 'd'는 데몬(daemon)을 의미하는데, 데몬이란 시스템의 백그라운드에서 실행되는 프로세스입니다. systemd는 시스템이 부팅된 다음 가장 먼저 생성되고, 다른 프로세스를 실행하는 과거의 init 을 대체하는 데몬입니다. 따라서 PID 1의 자리를 차지하고 있습니다.

### 서비스 파일 생성

서비스 파일 생성에 앞서서 FastAPI로 API를 띄우는 쉘 스크립트 파일을 `run_api.sh` 라고 하겠습니다. 서비스 파일은 `/etc/systemd/system`에 `서비스이름.service` 로 생성하면 됩니다. 위 경로에 대해서는 `sudo` 권한을 이용하여 접근해야 합니다. 예시 서비스 이름은 `api_service`로 하겠습니다.

```bash
sudo vi /etc/systemd/system/api_service.service
```

서비스 파일에는 다양한 섹션이 있는데요. 여기에서는 제가 사용했던 필수적인 섹션에 대해서만 설명하도록 하겠습니다. 제가 작성한 서비스 파일은 아래와 같습니다.

```ini
[Unit] 
Description=API Service 
After=network.target 

[Service] 
User=your_user
Group=your_group
WorkingDirectory=your_working_directory 
ExecStart=/bin/bash /home/your_user/your_working_directory/run_api.sh 
Restart=always 

[Install] 
WantedBy=multi-user.target
```

각 섹션에 대한 설명은 다음과 같습니다. 보다 자세한 내용은 아래 레퍼런스를 참고하시기 바랍니다.

- [[리눅스] systemd란? systemd unit파일 작성 방법](https://kim-dragon.tistory.com/202)
- [[리눅스] SYSTEMD 개념과 SYSTEMD를 통해서 SERVICE 실행하는 방법](https://reakwon.tistory.com/218)
- [systemd service](https://velog.io/@markyang92/systemd-timer)

#### Unit 섹션
- **Description** : 본 서비스에 대한 설명
- **After** : 본 서비스보다 먼저 실행되어야 하는 서비스 목록
- Before : 본 서비스 실행 이후에 실행되어야 하는 서비스 목록
- Requires : 본 서비스와 의존 관계에 있는 서비스 목록으로 본 서비스 실행을 위해 필수적으로 실행되고 있어야 함
- Wants : Requires보다는 약한 의존성을 가지는 서비스 목록

#### Service 섹션
- Type : 본 서비스가 어떤 형태로 동작할지 설정하는 값
	- simple : 기본값
	- forking : 서비스가 자식 프로세스를 생성할 때 사용 
	- oneshot : simple과 유사하지만 서비스 프로세스가 멈출 때 프로세스가 완전히 종료되는 형태
	- dbus : simple과 유사하지만 지정한 Bus Name이 D-Bus에 준비될 때까지 대기한 다음 D-Bus에 준비가 완료된 이후 프로세스가 시작됨
	- notify : simple과 유사하지만 서비스가 준비되면 알림을 전달한 후 시작됨
	- idle : 모든 서비스가 실행된 후에 실행됨
- **User** : 서비스 실행 시 어떤 사용자로 실행할지 설정하는 값
- **Group** : 서비스 실행 시 어떤 그룹으로 실행할지 설정하는 값
- **WorkingDirectory** : 서비스를 실행할 작업 디렉토리
- **ExecStart** : 실행할 명령 (절대경로로 설정)
- **Restart**: 재시작을 시도할 상황에 대한 설정값
	- always
	- on-success
	- on-failure
	- on-abort
	- …

#### Install 섹션
- **WantedBy** : 어떤 환경에서 서비스가 활성화되는지 설정하는 값

### 서비스 실행 후 등록하기

위처럼 서비스 파일을 생성해서 저장했다면 서비스를 실행해야 합니다. 우선 새로운 서비스 파일을 생성했기 때문에 데몬을 새로고침 해야 합니다. 아래 명령어로 데몬을 새로고침 합니다.

```bash
sudo systemctl daemon-reload
```

그 이후에 서비스를 실행하면 됩니다.

```bash
sudo systemctl start api_service  # 서비스 이름
```

서비스 실행 후 API가 잘 떠있는지 확인하기 위해 프로세스 정보를 확인하는 것도 좋습니다. 저는 gunicorn을 이용해 실행했으므로 아래 명령어로 프로세스가 잘 떠있는지 확인했습니다.

```bash
ps -ef | grep gunicorn
```

또 `systemctl`을 이용해서 서비스의 상태를 확인할 수 있습니다.

```bash
sudo systemctl status api_service

● api_service.service - API Service
     Loaded: loaded (/etc/systemd/system/api_service.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2024-07-10 13:56:42 KST; 21h ago
   Main PID: 2349637 (bash)
      Tasks: 20 (limit: 9462)
     Memory: 1.6G
        CPU: 4min 33.404s
     CGroup: /system.slice/api_service.service
             ├─2349637 /bin/bash /home/your_user/your_working_directory/run_api.sh
             ├─2349659 /home/your_user/your_working_directory/.venv/bin/python /home/your_user/your_working_directory/.venv/bin>
             ├─2380109 /home/your_user/your_working_directory/.venv/bin/python  /home/your_user/your_working_directory/.venv/bin>
             └─2380142 /home/your_user/your_working_directory/.venv/bin/python  /home/your_user/your_working_directory/.venv/bin>

Jul 10 13:56:42 dev-01 systemd[1]: Started API Service.
Jul 10 13:56:42 dev-01 bash[2349637]: Start API Server
```

정상적으로 서비스가 실행했다면 위와 같은 메시지를 확인하실 수 있습니다.

서비스를 중단할 때는 `stop`, 재시작할 때는 `restart` 명령어를 사용합니다.

```bash
sudo systemctl stop api_service  # 중단
sudo systemctl restart api_service  # 재시작
```

마지막으로 이 서비스를 시스템 부팅 시에 자동으로 실행하도록 등록합니다. 이를 위해선 반드시 서비스 파일에 Install 섹션을 설정해야 합니다. 아래 명령어를 이용해 서비스를 시스템 부팅 시 기동되게 할 수 있습니다.

```bash
sudo systemctl enable api_service
```

아래 명령어로 올바르게 등록이 되었는지도 확인할 수 있습니다.

```bash
sudo systemctl is-enabled api_service
```