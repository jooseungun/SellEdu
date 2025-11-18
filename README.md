# SellEdu - 콘텐츠 마켓 플랫폼

교육 콘텐츠 판매 및 구매를 위한 마켓플레이스 플랫폼입니다.

## 빠른 시작

### 로컬 개발 환경 설정

#### 1. 사전 요구사항 설치

```bash
# Wrangler CLI 설치 (Cloudflare Pages Functions 로컬 실행용)
npm install -g wrangler

# Wrangler 로그인
wrangler login
```

#### 2. 의존성 설치

```bash
# 루트 디렉토리
npm install

# 클라이언트 디렉토리
cd client
npm install
cd ..
```

#### 3. 로컬 서버 실행

**방법 1: Cloudflare Pages Functions 사용 (권장)**

```bash
# 클라이언트 빌드 후 Wrangler로 실행
npm run dev:pages
```

브라우저에서 `http://localhost:8788` 접속

**방법 2: React 개발 서버 + Wrangler (핫 리로드)**

터미널 1:
```bash
npm run client:dev
```

터미널 2:
```bash
npm run functions:dev
```

`.env.local` 파일 생성:
```env
REACT_APP_API_URL=http://localhost:8788/api/v1
```

브라우저에서 `http://localhost:3000` 접속

## 상세 가이드

로컬 개발 환경 설정에 대한 자세한 내용은 [LOCAL_DEV_GUIDE.md](./LOCAL_DEV_GUIDE.md)를 참조하세요.

## 프로젝트 구조

```
SellEdu/
├── client/              # React 클라이언트
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   └── utils/       # 유틸리티 함수
│   └── public/          # 정적 파일
├── functions/           # Cloudflare Pages Functions
│   └── api/
│       └── v1/         # API 엔드포인트
├── wrangler.toml       # Cloudflare 설정
└── package.json        # 프로젝트 설정
```

## 주요 기능

- 사용자 인증 (로그인/회원가입)
- 판매자 콘텐츠 등록 및 관리
- 구매자 콘텐츠 검색 및 구매
- 관리자 대시보드
- 제휴할인 신청 및 관리

## 기술 스택

- **Frontend**: React, Material-UI
- **Backend**: Cloudflare Pages Functions
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## 배포

프로젝트는 Cloudflare Pages에 자동 배포됩니다. `main` 브랜치에 푸시하면 자동으로 배포가 시작됩니다.

## 라이선스

MIT
