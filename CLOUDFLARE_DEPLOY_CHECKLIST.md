# Cloudflare Pages 배포 체크리스트

## ✅ 필수 확인 사항

### 1. Cloudflare Pages 대시보드 설정

**프로젝트 설정**:
- [ ] 프로젝트 이름: `selledu` (또는 원하는 이름)
- [ ] 프로덕션 브랜치: `main`
- [ ] Root directory: `/` (루트 디렉토리, 변경하지 않음)

**빌드 설정**:
- [ ] Framework preset: `Create React App` 또는 `None`
- [ ] Build command: `cd client && npm install && npm run build`
- [ ] Build output directory: `client/build`
- [ ] Node version: `18` 또는 `20`

### 2. 파일 확인

**필수 파일 존재 확인**:
- [x] `client/public/index.html` ✅
- [x] `client/public/_redirects` ✅
- [x] `client/public/_headers` ✅
- [x] `client/src/index.js` ✅
- [x] `client/src/App.js` ✅
- [x] `client/package.json` ✅

### 3. _redirects 파일 형식

`client/public/_redirects` 파일 내용:
```
/*    /index.html   200
```

**중요**: 
- 탭 또는 공백으로 구분
- 빌드 후 `client/build/_redirects`에 복사되어야 함

### 4. package.json 설정

`client/package.json` 확인:
```json
{
  "homepage": ".",
  "scripts": {
    "build": "react-scripts build"
  }
}
```

### 5. 환경 변수 (선택사항)

프로토타입 버전에서는 필수 아님:
- `NODE_ENV=production` (자동 설정됨)
- `REACT_APP_API_URL` (프로토타입에서는 불필요)

## 🔧 문제 해결 단계

### Step 1: 로컬 빌드 테스트

로컬에서 빌드가 성공하는지 확인:
```bash
cd client
npm install
npm run build
```

성공하면 `client/build` 폴더가 생성됩니다.

### Step 2: 빌드 출력 확인

빌드 후 다음 파일들이 생성되는지 확인:
- `client/build/index.html`
- `client/build/static/` 폴더
- `client/build/_redirects` (public 폴더에서 복사됨)

### Step 3: Cloudflare Pages 설정 확인

1. Cloudflare 대시보드 접속
2. Pages → 프로젝트 선택
3. Settings → Builds & deployments
4. 빌드 설정 확인 및 수정

### Step 4: 배포 재시도

1. Settings → Builds & deployments
2. "Retry deployment" 클릭
3. 빌드 로그 확인

## 🐛 일반적인 에러 및 해결

### 에러 1: "Build output directory not found"
**원인**: 빌드 출력 디렉토리가 잘못 설정됨

**해결**:
- Build output directory를 `client/build`로 설정
- 로컬에서 빌드 후 `client/build` 폴더가 생성되는지 확인

### 에러 2: "Build command failed"
**원인**: 빌드 명령어 오류 또는 의존성 문제

**해결**:
- Build command: `cd client && npm install && npm run build`
- 로컬에서 빌드 테스트
- `package-lock.json` 파일 확인

### 에러 3: "404 Not Found" (SPA 라우팅)
**원인**: `_redirects` 파일이 빌드 출력에 포함되지 않음

**해결**:
- `client/public/_redirects` 파일 확인
- 빌드 후 `client/build/_redirects` 파일 존재 확인
- 파일 형식 확인: `/*    /index.html   200`

### 에러 4: "Module not found"
**원인**: 의존성 설치 실패

**해결**:
- `client/package.json` 확인
- Node 버전 확인 (18 이상)
- 빌드 캐시 클리어 후 재배포

## 📝 배포 후 확인

배포 성공 후:
1. 사이트 URL 접속 확인
2. 메인 페이지 로드 확인
3. 로그인/회원가입 페이지 접속 확인
4. SPA 라우팅 확인 (직접 URL 접속)

## 💡 추가 팁

1. **빌드 캐시 클리어**: 
   - Settings → Builds & deployments → "Clear build cache"

2. **빌드 로그 확인**:
   - Deployments → 최신 배포 → Build logs

3. **환경 변수 확인**:
   - Settings → Environment variables

4. **자동 배포 확인**:
   - GitHub에 push하면 자동으로 재배포됨

