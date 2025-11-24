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

### 2. PowerShell 스크립트 (Windows)

```powershell
.\scripts\auto-commit-deploy.ps1
```

또는 커밋 메시지를 직접 지정:

```powershell
.\scripts\auto-commit-deploy.ps1 "커밋 메시지"
```

### 3. Bash 스크립트 (Linux/Mac)

```bash
chmod +x scripts/auto-commit-deploy.sh
./scripts/auto-commit-deploy.sh
```

또는 커밋 메시지를 직접 지정:

```bash
./scripts/auto-commit-deploy.sh "커밋 메시지"
```

### 4. 자동 커밋 (메시지 없이)

```bash
npm run deploy:auto
```

## 동작 방식

1. 변경사항이 있는지 확인
2. 모든 변경사항을 스테이징 (`git add -A`)
3. 커밋 메시지로 커밋
4. 원격 저장소로 푸시 (`git push origin main`)
5. Cloudflare Pages가 자동으로 배포 시작

## 주의사항

- 변경사항이 없으면 스크립트가 종료됩니다
- 커밋 메시지를 입력하지 않으면 기본 메시지가 사용됩니다
- 푸시 후 Cloudflare Pages가 자동으로 배포를 시작합니다 (약 1-2분 소요)

