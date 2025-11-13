# 빠른 배포 가이드

## 🚀 Vercel을 사용한 5분 배포

### 1단계: Vercel 계정 생성
1. https://vercel.com 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인

### 2단계: 프로젝트 배포
1. Vercel 대시보드에서 "Add New..." → "Project" 클릭
2. GitHub 저장소 목록에서 `SellEdu` 선택
3. "Import" 클릭

### 3단계: 프로젝트 설정
**Root Directory**: `.` (기본값 유지)

**Build Settings**:
- Framework Preset: **Other**
- Build Command: `cd client && npm install && npm run build`
- Output Directory: `client/build`

**Environment Variables** (나중에 추가 가능):
```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=selledu
JWT_SECRET=your-secret-key-change-this
NODE_ENV=production
```

### 4단계: Deploy
- "Deploy" 버튼 클릭
- 약 2-3분 후 배포 완료
- 자동으로 생성된 URL로 접속 가능 (예: `https://selledu.vercel.app`)

## 📝 참고사항

### 데이터베이스 설정
- Vercel은 서버리스 환경이므로 별도의 데이터베이스가 필요합니다
- 무료 옵션:
  - **PlanetScale** (MySQL 호환, 무료 티어 제공)
  - **Supabase** (PostgreSQL, 무료 티어 제공)
  - **Railway** (MySQL, 무료 크레딧 제공)

### PlanetScale 사용 예시
1. https://planetscale.com 접속 및 가입
2. 새 데이터베이스 생성
3. 연결 정보를 Vercel Environment Variables에 추가
4. `npm run db:migrate` 실행 (로컬에서 또는 Vercel Functions에서)

## 🔄 자동 배포
- GitHub에 push하면 자동으로 재배포됩니다
- Pull Request마다 Preview 배포가 생성됩니다

## 🌐 배포된 사이트 확인
배포 완료 후 Vercel 대시보드에서 제공하는 URL로 접속하세요!


