# API 서버 설정 가이드

## ⚠️ 중요: 백엔드 서버 배포 필요

Cloudflare Pages는 **정적 파일만 호스팅**하므로, API 요청은 별도의 백엔드 서버로 전달되어야 합니다.

## 현재 문제

프론트엔드가 `https://selledu.pages.dev/api/v1/auth/login`으로 요청을 보내지만, Cloudflare Pages는 이 요청을 처리할 수 없어 405 에러가 발생합니다.

## 해결 방법

### 방법 1: Railway로 백엔드 배포 (권장)

1. **Railway 계정 생성**
   - https://railway.app 접속
   - GitHub 계정으로 로그인

2. **프로젝트 생성**
   - "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - `SellEdu` 저장소 선택

3. **서비스 설정**
   - "New Service" → "GitHub Repo" 선택
   - **Root Directory**: `server`
   - **Start Command**: `node index.js`

4. **환경 변수 설정**
   Railway 대시보드에서 다음 변수 추가:
   ```
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=selledu
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   PORT=3000
   ```

5. **데이터베이스 추가**
   - Railway 대시보드에서 "New" → "Database" → "MySQL" 선택
   - 자동으로 생성된 데이터베이스 정보를 환경 변수에 추가

6. **마이그레이션 및 시드 실행**
   Railway 서비스에서 다음 명령어 실행:
   ```bash
   cd server
   node database/migrate.js
   node database/seed.js
   ```

7. **Cloudflare Pages 환경 변수 설정**
   Cloudflare Pages 프로젝트 → Settings → Environment variables에서:
   ```
   REACT_APP_API_URL=https://your-railway-app.up.railway.app/api/v1
   ```
   
   예시:
   ```
   REACT_APP_API_URL=https://selledu-api.up.railway.app/api/v1
   ```

### 방법 2: Render로 백엔드 배포

1. **Render 계정 생성**
   - https://render.com 접속
   - GitHub 계정으로 로그인

2. **Web Service 생성**
   - "New" → "Web Service" 선택
   - GitHub 저장소 연결
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

3. **환경 변수 및 데이터베이스 설정**
   - Railway와 동일한 방식으로 설정

4. **Cloudflare Pages 환경 변수 설정**
   ```
   REACT_APP_API_URL=https://your-render-app.onrender.com/api/v1
   ```

### 방법 3: 로컬 개발 환경

로컬에서 개발하는 경우:

1. **백엔드 서버 실행**
   ```bash
   cd server
   npm install
   node index.js
   ```

2. **프론트엔드 실행**
   ```bash
   cd client
   npm install
   npm start
   ```

   `package.json`의 `proxy` 설정으로 자동 프록시됩니다.

## 환경 변수 확인

### Cloudflare Pages
프로젝트 → Settings → Environment variables에서 확인:
- `REACT_APP_API_URL`이 백엔드 서버 주소로 설정되어 있는지 확인

### 빌드 시 확인
빌드 로그에서 다음을 확인:
```
REACT_APP_API_URL=https://your-backend-server.com/api/v1
```

## 테스트

백엔드 서버가 배포된 후:

1. **Health Check**
   ```
   GET https://your-backend-server.com/health
   ```
   응답: `{ "status": "ok", "timestamp": "..." }`

2. **로그인 테스트**
   ```
   POST https://your-backend-server.com/api/v1/auth/login
   Body: { "username": "admin", "password": "admin" }
   ```

## 문제 해결

### 405 에러가 계속 발생하는 경우
1. 백엔드 서버가 실행 중인지 확인
2. `REACT_APP_API_URL` 환경 변수가 올바르게 설정되었는지 확인
3. 브라우저 개발자 도구 → Network 탭에서 실제 요청 URL 확인

### CORS 에러가 발생하는 경우
1. 백엔드 서버의 CORS 설정 확인 (`server/index.js`)
2. 백엔드 서버가 프론트엔드 도메인을 허용하는지 확인

### 연결 시간 초과
1. 백엔드 서버가 실행 중인지 확인
2. 방화벽 설정 확인
3. Railway/Render 서비스 상태 확인

