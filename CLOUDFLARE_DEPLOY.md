# Cloudflare Pages 배포 가이드

## 🚀 Cloudflare Pages로 배포하기

### 1단계: Cloudflare 계정 생성
1. https://dash.cloudflare.com 접속
2. "Sign Up" 클릭하여 계정 생성 (또는 로그인)

### 2단계: Pages 프로젝트 생성
1. Cloudflare 대시보드에서 **Pages** 메뉴 클릭
2. "Create a project" 클릭
3. "Connect to Git" 선택
4. GitHub 저장소 선택 화면에서:
   - **GitHub** 선택
   - 권한 승인
   - `SellEdu` 저장소 선택

### 3단계: 빌드 설정 (중요!)
**프로젝트 이름**: `selledu` (또는 원하는 이름)

**프로덕션 브랜치**: `main`

**빌드 설정**:
- **Framework preset**: `Create React App` 또는 `None`
- **Root directory**: `/` (기본값, 변경하지 않음)
- **Build command**: `cd client && npm install && npm run build`
- **Build output directory**: `client/build`

> ⚠️ **중요**: 
> - Root directory는 반드시 `/` (루트)로 설정해야 합니다
> - Build output directory는 `client/build`로 설정합니다
> - React 앱은 `client/build` 폴더에 빌드되며, Cloudflare Pages가 이 폴더를 서빙합니다

### 4단계: 환경 변수 설정
**Environment variables** 섹션에서 다음 변수 추가:

```
NODE_ENV=production
REACT_APP_API_URL=https://your-api-domain.com/api/v1
```

> **참고**: 백엔드 API는 별도로 배포해야 합니다 (아래 참조)

### 5단계: 배포
- "Save and Deploy" 클릭
- 약 2-3분 후 배포 완료
- 자동 생성된 URL로 접속 가능 (예: `https://selledu.pages.dev`)

## 📁 프로젝트 구조

```
SellEdu/
├── client/              # React 프론트엔드
│   ├── public/
│   │   ├── index.html   # React 앱의 진입점
│   │   ├── _redirects   # SPA 라우팅 설정
│   │   └── _headers     # 보안 헤더 설정
│   ├── src/             # React 소스 코드
│   └── build/           # 빌드 출력 (자동 생성)
├── server/              # Node.js 백엔드
└── cloudflare-pages.json  # Cloudflare Pages 설정
```

## 🔧 백엔드 API 배포 옵션

Cloudflare Pages는 프론트엔드만 호스팅하므로, 백엔드 API는 별도로 배포해야 합니다.

### 옵션 1: Cloudflare Workers (권장)
Node.js 백엔드를 Cloudflare Workers로 마이그레이션

### 옵션 2: 별도 서버 배포
- **Railway**: https://railway.app (무료 크레딧 제공)
- **Render**: https://render.com (무료 티어 제공)
- **Fly.io**: https://fly.io (무료 티어 제공)

### 옵션 3: Cloudflare Workers + D1 Database
- Cloudflare Workers로 API 구현
- D1 Database (SQLite) 사용

## 📝 Railway로 백엔드 배포 예시

### 1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인

### 2. 프로젝트 생성
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `SellEdu` 저장소 선택

### 3. 서비스 설정
1. "New Service" → "GitHub Repo" 선택
2. 저장소 선택 후 **Root Directory**를 `server`로 설정
3. **Start Command**: `node index.js`

### 4. 환경 변수 설정
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

### 5. 데이터베이스 추가
1. Railway 대시보드에서 "New" → "Database" → "MySQL" 선택
2. 자동으로 생성된 데이터베이스 정보를 환경 변수에 추가

### 6. 프론트엔드 API URL 업데이트
Cloudflare Pages 환경 변수에서:
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api/v1
```

## 🔄 자동 배포 설정

### Cloudflare Pages
- GitHub에 push하면 자동으로 재배포됩니다
- Pull Request마다 Preview 배포가 생성됩니다

### 커스텀 도메인 설정
1. Cloudflare Pages 프로젝트에서 "Custom domains" 클릭
2. 도메인 추가
3. DNS 설정은 자동으로 구성됩니다

## 📊 모니터링

### Cloudflare Analytics
- Cloudflare 대시보드에서 Analytics 확인 가능
- 트래픽, 성능 메트릭 등 제공

### 로그 확인
- Cloudflare Pages: 대시보드에서 빌드 로그 확인
- Railway: 서비스 로그에서 실시간 로그 확인

## 🛠️ 문제 해결

### 빌드 실패 시
1. Cloudflare Pages 대시보드에서 빌드 로그 확인
2. 로컬에서 빌드 테스트: `cd client && npm run build`
3. 환경 변수 확인
4. **Root directory**가 `/`로 설정되어 있는지 확인
5. **Build output directory**가 `client/build`로 설정되어 있는지 확인

### 404 에러 발생 시
1. `client/public/_redirects` 파일이 있는지 확인
2. 빌드 출력 디렉토리가 올바른지 확인
3. SPA 라우팅 설정 확인

### API 연결 실패 시
1. CORS 설정 확인
2. API URL이 올바른지 확인
3. 백엔드 서버가 실행 중인지 확인

## 💡 최적화 팁

1. **이미지 최적화**: Cloudflare Images 사용
2. **CDN**: Cloudflare의 글로벌 CDN 자동 적용
3. **캐싱**: Cloudflare의 캐싱 정책 활용
4. **보안**: Cloudflare의 DDoS 보호 자동 적용

## ✅ 체크리스트

배포 전 확인사항:
- [ ] `client/public/index.html`이 존재하는가?
- [ ] `client/public/_redirects` 파일이 있는가?
- [ ] `client/public/_headers` 파일이 있는가?
- [ ] Root directory가 `/`로 설정되어 있는가?
- [ ] Build output directory가 `client/build`로 설정되어 있는가?
- [ ] 환경 변수가 올바르게 설정되어 있는가?
