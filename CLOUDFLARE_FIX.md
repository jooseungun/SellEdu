# Cloudflare Pages 배포 문제 해결 가이드

## 🔍 일반적인 배포 문제

### 1. 빌드 실패
**증상**: 빌드가 실패하거나 타임아웃 발생

**해결 방법**:
1. Cloudflare Pages 대시보드 → 프로젝트 → Settings → Builds & deployments
2. 빌드 설정 확인:
   - **Framework preset**: `Create React App` 또는 `None`
   - **Root directory**: `/` (루트 디렉토리)
   - **Build command**: `cd client && npm install && npm run build`
   - **Build output directory**: `client/build`
   - **Node version**: `18` 또는 `20`

3. 로컬에서 빌드 테스트:
   ```bash
   cd client
   npm install
   npm run build
   ```
   로컬에서 빌드가 성공하면 Cloudflare에서도 성공해야 합니다.

### 2. 404 에러 (SPA 라우팅 문제)
**증상**: 직접 URL 접근 시 404 에러 발생

**해결 방법**:
1. `client/public/_redirects` 파일 확인:
   ```
   /*    /index.html   200
   ```
   이 파일이 `client/build` 폴더에 복사되는지 확인

2. 빌드 후 `client/build/_redirects` 파일이 생성되는지 확인

### 3. 빌드 출력 디렉토리 오류
**증상**: "Build output directory not found" 에러

**해결 방법**:
1. Build output directory를 `client/build`로 설정
2. 빌드 후 `client/build` 폴더가 생성되는지 확인
3. `client/build/index.html` 파일이 존재하는지 확인

### 4. 환경 변수 문제
**증상**: 빌드는 성공하지만 런타임 에러 발생

**해결 방법**:
1. Cloudflare Pages 대시보드 → Settings → Environment variables
2. 다음 변수 확인:
   ```
   NODE_ENV=production
   REACT_APP_API_URL=(선택사항, 프로토타입에서는 필요 없음)
   ```

### 5. 의존성 설치 실패
**증상**: `npm install` 실패

**해결 방법**:
1. `client/package.json` 확인
2. Node 버전 확인 (18 이상 권장)
3. `package-lock.json` 파일이 있는지 확인

## 🛠️ 단계별 해결 방법

### Step 1: 로컬 빌드 테스트
```bash
cd client
npm install
npm run build
```

빌드가 성공하면 `client/build` 폴더가 생성됩니다.

### Step 2: Cloudflare Pages 설정 확인
1. Cloudflare 대시보드 접속
2. Pages → 프로젝트 선택
3. Settings → Builds & deployments
4. 다음 설정 확인:
   - Root directory: `/`
   - Build command: `cd client && npm install && npm run build`
   - Build output directory: `client/build`
   - Node version: `18`

### Step 3: 빌드 로그 확인
1. Cloudflare Pages 대시보드 → Deployments
2. 최신 배포 클릭
3. Build logs 확인
4. 에러 메시지 확인

### Step 4: 파일 확인
다음 파일들이 존재하는지 확인:
- ✅ `client/public/index.html`
- ✅ `client/public/_redirects`
- ✅ `client/src/index.js`
- ✅ `client/package.json`

## 📝 체크리스트

배포 전 확인:
- [ ] 로컬에서 빌드 성공 (`cd client && npm run build`)
- [ ] `client/build` 폴더 생성 확인
- [ ] `client/build/index.html` 파일 존재 확인
- [ ] `client/build/_redirects` 파일 존재 확인
- [ ] Cloudflare Pages 빌드 설정 확인
- [ ] 환경 변수 설정 확인 (필요시)

## 🔧 빠른 수정

### _redirects 파일 수정
`client/public/_redirects` 파일 내용:
```
/*    /index.html   200
```

### package.json 확인
`client/package.json`에 다음이 있는지 확인:
```json
{
  "homepage": ".",
  "scripts": {
    "build": "react-scripts build"
  }
}
```

## 💡 추가 팁

1. **빌드 캐시 클리어**: Cloudflare Pages 대시보드에서 "Clear build cache" 클릭
2. **재배포**: Settings → Builds & deployments → "Retry deployment"
3. **로그 확인**: 빌드 로그에서 정확한 에러 메시지 확인

