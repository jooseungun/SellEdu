# 백엔드 서버 배포 가이드

## 🚀 Railway로 배포하기 (권장)

### 1단계: Railway 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인
3. 무료 크레딧 제공 (월 $5)

### 2단계: 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `SellEdu` 저장소 선택

### 3단계: 서비스 생성
1. "New" → "Service" → "GitHub Repo" 선택
2. 저장소 선택
3. **Root Directory**: `server` 설정
4. **Start Command**: `node index.js` (자동 감지됨)

### 4단계: 데이터베이스 추가
1. "New" → "Database" → "MySQL" 선택
2. 자동으로 MySQL 데이터베이스 생성
3. 데이터베이스 정보는 자동으로 환경 변수에 추가됨

### 5단계: 환경 변수 설정
Railway 대시보드 → Variables 탭에서 다음 변수 설정:

**자동 생성되는 변수 (데이터베이스):**
- `MYSQL_HOST` → `DB_HOST`로 매핑 필요
- `MYSQL_USER` → `DB_USER`로 매핑 필요
- `MYSQL_PASSWORD` → `DB_PASSWORD`로 매핑 필요
- `MYSQL_DATABASE` → `DB_NAME`로 매핑 필요
- `MYSQL_PORT` → `DB_PORT`로 매핑 필요

**수동 추가 변수:**
```
DB_HOST=${{MYSQL_HOST}}
DB_USER=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_NAME=${{MYSQL_DATABASE}}
DB_PORT=${{MYSQL_PORT}}
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

### 6단계: 데이터베이스 초기화
Railway 서비스 → Deployments → 최신 배포 → View Logs에서:

**방법 1: Railway CLI 사용**
```bash
railway run node database/migrate.js
railway run node database/seed.js
```

**방법 2: Railway Shell 사용**
1. Railway 대시보드 → Service → "Shell" 탭
2. 다음 명령어 실행:
```bash
cd server
node database/migrate.js
node database/seed.js
```

### 7단계: 배포 확인
1. Railway 대시보드에서 서비스 URL 확인 (예: `https://selledu-api.up.railway.app`)
2. Health Check: `https://your-app.up.railway.app/health`
3. 응답 확인: `{ "status": "ok", "timestamp": "..." }`

### 8단계: Cloudflare Pages 환경 변수 설정
1. Cloudflare Pages 대시보드 접속
2. 프로젝트 → Settings → Environment variables
3. 다음 변수 추가:
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api/v1
```

## 🚀 Render로 배포하기

### 1단계: Render 계정 생성
1. https://render.com 접속
2. GitHub 계정으로 로그인
3. 무료 티어 제공

### 2단계: Web Service 생성
1. "New" → "Web Service" 선택
2. GitHub 저장소 연결
3. **Root Directory**: `server`
4. **Build Command**: `npm install`
5. **Start Command**: `node index.js`

### 3단계: 데이터베이스 추가
1. "New" → "PostgreSQL" 또는 "MySQL" 선택
2. 데이터베이스 생성
3. 내부 데이터베이스 URL 자동 생성

### 4단계: 환경 변수 설정
Render 대시보드 → Environment에서:
```
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=selledu
DB_PORT=5432
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

### 5단계: 데이터베이스 초기화
Render Shell에서:
```bash
cd server
node database/migrate.js
node database/seed.js
```

## 📋 배포 체크리스트

### 배포 전 확인사항
- [ ] `server/package.json` 파일 존재
- [ ] 모든 의존성 패키지 설치 가능
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 연결 정보 확인
- [ ] JWT_SECRET 설정 (프로덕션용 강력한 키)

### 배포 후 확인사항
- [ ] Health Check 엔드포인트 동작 확인 (`/health`)
- [ ] 로그인 API 테스트 (`/api/v1/auth/login`)
- [ ] 관리자 계정 생성 확인 (서버 로그에서 확인)
- [ ] CORS 설정 확인
- [ ] Cloudflare Pages 환경 변수 설정

## 🔧 문제 해결

### 데이터베이스 연결 실패
1. 환경 변수가 올바르게 설정되었는지 확인
2. 데이터베이스가 실행 중인지 확인
3. 방화벽 설정 확인 (Railway/Render는 자동 처리)

### 마이그레이션 실패
1. 데이터베이스가 생성되었는지 확인
2. 사용자 권한 확인
3. SQL 문법 오류 확인

### 서버가 시작되지 않음
1. 로그 확인 (Railway/Render 대시보드)
2. 포트 설정 확인 (환경 변수 `PORT`)
3. 의존성 설치 확인

## 📊 모니터링

### Railway
- 대시보드에서 실시간 로그 확인
- 메트릭 및 트래픽 모니터링
- 자동 재시작 설정

### Render
- 대시보드에서 로그 확인
- Health Check 모니터링
- 자동 스케일링 설정

## 🔐 보안 권장사항

1. **JWT_SECRET**: 강력한 랜덤 문자열 사용
2. **데이터베이스 비밀번호**: 복잡한 비밀번호 사용
3. **환경 변수**: 프로덕션 환경에서 안전하게 관리
4. **CORS**: 프로덕션에서는 특정 도메인만 허용

## 💡 팁

- Railway는 자동으로 HTTPS 제공
- Render는 무료 티어에서 15분 비활성 시 슬리프 모드
- 데이터베이스 백업 정기적으로 수행
- 환경 변수는 민감 정보이므로 Git에 커밋하지 않음

