# Railway 빠른 배포 가이드

## 🚀 5분 안에 배포하기

### 1단계: Railway 계정 생성 (1분)
1. https://railway.app 접속
2. "Start a New Project" 클릭
3. GitHub 계정으로 로그인
4. 권한 승인

### 2단계: 프로젝트 생성 (1분)
1. "Deploy from GitHub repo" 선택
2. `jooseungun/SellEdu` 저장소 선택
3. "Deploy Now" 클릭

### 3단계: 서비스 설정 (1분)
1. 자동으로 서비스가 생성됨
2. 서비스 클릭 → Settings 탭
3. **Root Directory** 설정:
   - "Root Directory" 필드에 `server` 입력
4. **Start Command** 확인:
   - `node index.js` (자동 감지됨)

### 4단계: 데이터베이스 추가 (1분)
1. 프로젝트 대시보드에서 "New" 클릭
2. "Database" → "MySQL" 선택
3. 자동으로 MySQL 데이터베이스 생성됨
4. 데이터베이스 정보는 자동으로 환경 변수에 추가됨

### 5단계: 환경 변수 설정 (1분)
1. 서비스 → Variables 탭 클릭
2. 다음 변수들을 추가:

**데이터베이스 변수 (자동 생성된 변수 참조):**
```
DB_HOST=${{MYSQL_HOST}}
DB_USER=${{MYSQL_USER}}
DB_PASSWORD=${{MYSQL_PASSWORD}}
DB_NAME=${{MYSQL_DATABASE}}
DB_PORT=${{MYSQL_PORT}}
```

**서버 설정 변수:**
```
JWT_SECRET=your-secret-key-change-this-to-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

**JWT_SECRET 생성 방법:**
- 온라인: https://randomkeygen.com/ 에서 "CodeIgniter Encryption Keys" 사용
- 또는 터미널: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 6단계: 데이터베이스 초기화 (1분)
1. 서비스 → Deployments 탭
2. 최신 배포의 "..." 메뉴 → "View Logs" 클릭
3. 또는 서비스 → Settings → "Open Shell" 클릭
4. Shell에서 다음 명령어 실행:

```bash
cd server
node database/migrate.js
node database/seed.js
```

### 7단계: 배포 확인
1. 서비스 → Settings → "Generate Domain" 클릭
2. 생성된 URL 확인 (예: `https://selledu-api.up.railway.app`)
3. Health Check: `https://your-app.up.railway.app/health`
4. 응답 확인: `{ "status": "ok", ... }`

### 8단계: Cloudflare Pages 연결
1. Cloudflare Pages 대시보드 접속
2. 프로젝트 → Settings → Environment variables
3. 다음 변수 추가:
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api/v1
```

## ✅ 배포 완료 체크리스트

- [ ] Railway 서비스가 실행 중
- [ ] Health Check 응답 확인 (`/health`)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 관리자 계정 생성 확인 (로그에서 확인)
- [ ] Cloudflare Pages 환경 변수 설정
- [ ] 로그인 테스트 성공

## 🔧 문제 해결

### 서버가 시작되지 않음
- 로그 확인: 서비스 → Deployments → View Logs
- 환경 변수 확인: 모든 필수 변수가 설정되었는지 확인
- Root Directory 확인: `server`로 설정되었는지 확인

### 데이터베이스 연결 실패
- 환경 변수 확인: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` 확인
- 데이터베이스 서비스가 실행 중인지 확인

### 마이그레이션 실패
- 데이터베이스가 생성되었는지 확인
- Shell에서 직접 실행: `cd server && node database/migrate.js`

## 📊 모니터링

- **로그 확인**: 서비스 → Deployments → View Logs
- **메트릭**: 서비스 → Metrics 탭
- **사용량**: 프로젝트 → Usage 탭 (월 $5 크레딧 확인)

## 🎉 완료!

이제 백엔드 서버가 Railway에 배포되었습니다!
프론트엔드에서 API를 호출할 수 있습니다.

