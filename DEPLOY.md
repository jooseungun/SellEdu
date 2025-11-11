# 배포 가이드

## Vercel을 사용한 배포 (권장)

### 1. Vercel 계정 생성
- https://vercel.com 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 배포
1. Vercel 대시보드에서 "New Project" 클릭
2. GitHub 저장소 선택
3. 프로젝트 설정:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
4. Environment Variables 추가:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
5. Deploy 클릭

### 3. 자동 배포
- GitHub에 push하면 자동으로 배포됩니다.

## Netlify를 사용한 배포

### 1. Netlify 계정 생성
- https://www.netlify.com 접속
- GitHub 계정으로 로그인

### 2. 프로젝트 배포
1. Netlify 대시보드에서 "New site from Git" 클릭
2. GitHub 저장소 선택
3. 빌드 설정:
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/build`
4. Environment Variables 추가
5. Deploy site 클릭

## 수동 배포

### 1. 클라이언트 빌드
```bash
cd client
npm install
npm run build
```

### 2. 서버 배포
- Heroku, AWS, DigitalOcean 등 원하는 플랫폼에 배포
- 환경 변수 설정 필수

## 환경 변수 설정

배포 시 다음 환경 변수를 설정해야 합니다:

```env
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=selledu
JWT_SECRET=your-secret-key
NODE_ENV=production
```

