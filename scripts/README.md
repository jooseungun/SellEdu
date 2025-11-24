# 자동 커밋 및 배포 스크립트

이 디렉토리에는 자동 커밋 및 배포를 위한 스크립트가 포함되어 있습니다.

## 사용 방법

### 1. Node.js 스크립트 (권장)

```bash
npm run deploy
```

또는 커밋 메시지를 직접 지정:

```bash
npm run deploy "커밋 메시지"
```

### 2. 자동 감지 모드 (파일 변경 시 자동 커밋)

```bash
npm run watch
```

이 명령어를 실행하면 파일 변경을 감지하고 자동으로 커밋 및 배포합니다.

### 3. PowerShell 스크립트 (Windows)

```powershell
.\scripts\auto-commit-deploy.ps1
```

또는 커밋 메시지를 직접 지정:

```powershell
.\scripts\auto-commit-deploy.ps1 "커밋 메시지"
```

### 4. Bash 스크립트 (Linux/Mac)

```bash
chmod +x scripts/auto-commit-deploy.sh
./scripts/auto-commit-deploy.sh
```

또는 커밋 메시지를 직접 지정:

```bash
./scripts/auto-commit-deploy.sh "커밋 메시지"
```

### 5. 자동 커밋 (메시지 없이)

```bash
npm run deploy:auto
```

## 동작 방식

1. 변경사항이 있는지 확인
2. 모든 변경사항을 스테이징 (`git add -A`)
3. 커밋 메시지로 커밋
4. 원격 저장소로 푸시 (`git push origin main`)
5. Cloudflare Pages가 자동으로 배포 시작

## 자동 감지 모드 (watch)

`npm run watch`를 실행하면:
- 5초마다 파일 변경사항을 체크
- 변경사항이 감지되면 3초 대기 후 자동 커밋
- 자동으로 푸시하여 Cloudflare Pages 배포 시작

## 주의사항

- 변경사항이 없으면 스크립트가 종료됩니다
- 커밋 메시지를 입력하지 않으면 기본 메시지가 사용됩니다
- 푸시 후 Cloudflare Pages가 자동으로 배포를 시작합니다 (약 1-2분 소요)
- 자동 감지 모드는 백그라운드에서 계속 실행됩니다 (Ctrl+C로 종료)
