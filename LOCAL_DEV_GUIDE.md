# 로컬 개발 환경 가이드

이 가이드는 SellEdu 프로젝트를 로컬에서 실행하는 방법을 설명합니다.

## 사전 요구사항

1. **Node.js** (v18 이상)
2. **npm** 또는 **yarn**
3. **Wrangler CLI** (Cloudflare Pages Functions 로컬 실행용)

### Wrangler 설치

```bash
npm install -g wrangler
```

또는

```bash
npm install -g @cloudflare/wrangler
```

### Wrangler 로그인

```bash
wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하세요.

## 로컬 개발 방법

### 방법 1: Cloudflare Pages Functions 사용 (권장)

프로덕션 환경과 동일한 방식으로 로컬에서 실행합니다.

#### 1단계: 클라이언트 빌드

```bash
npm run client:build
```

#### 2단계: Wrangler로 로컬 서버 실행

```bash
npm run dev:pages
```

또는

```bash
wrangler pages dev client/build --port 8788
```

이 명령어는:
- 클라이언트 빌드 결과물을 서빙합니다
- Cloudflare Pages Functions를 로컬에서 실행합니다
- D1 데이터베이스에 연결합니다 (wrangler.toml 설정 사용)

#### 3단계: 브라우저에서 접속

```
http://localhost:8788
```

### 방법 2: React 개발 서버 + Wrangler (핫 리로드 지원)

React 개발 서버의 핫 리로드 기능을 사용하면서 Functions도 함께 테스트할 수 있습니다.

#### 1단계: React 개발 서버 실행 (터미널 1)

```bash
npm run client:dev
```

React 앱이 `http://localhost:3000`에서 실행됩니다.

#### 2단계: Wrangler Functions 실행 (터미널 2)

```bash
npm run functions:dev
```

Functions가 `http://localhost:8788`에서 실행됩니다.

#### 3단계: 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 추가:

```env
REACT_APP_API_URL=http://localhost:8788/api/v1
```

#### 4단계: 브라우저에서 접속

```
http://localhost:3000
```

React 개발 서버가 실행 중이고, API 호출은 `http://localhost:8788/api/v1`로 전달됩니다.

## D1 데이터베이스 로컬 설정

### 로컬 D1 데이터베이스 생성

```bash
wrangler d1 create selledu-db
```

생성된 데이터베이스 ID를 `wrangler.toml`의 `database_id`에 추가하세요.

### 로컬 D1 데이터베이스에 쿼리 실행

```bash
wrangler d1 execute selledu-db --local --file=./schema.sql
```

또는 대화형 쿼리:

```bash
wrangler d1 execute selledu-db --local --command="SELECT * FROM users"
```

## 환경 변수 설정

### 로컬 개발용 환경 변수

`.env.local` 파일을 생성하세요:

```env
# API URL (방법 2 사용 시)
REACT_APP_API_URL=http://localhost:8788/api/v1

# 개발 환경
NODE_ENV=development
```

## 주요 스크립트

- `npm run dev:pages` - 클라이언트 빌드 후 Wrangler로 실행 (방법 1)
- `npm run client:dev` - React 개발 서버만 실행
- `npm run functions:dev` - Wrangler Functions만 실행
- `npm run client:build` - 클라이언트 빌드

## 문제 해결

### Wrangler가 설치되지 않음

```bash
npm install -g wrangler
```

### D1 데이터베이스 연결 오류

1. `wrangler.toml`의 `database_id`가 올바른지 확인
2. `wrangler login`으로 로그인했는지 확인
3. 로컬 D1 데이터베이스가 생성되었는지 확인

### 포트 충돌

기본 포트가 사용 중이면 다른 포트를 사용하세요:

```bash
wrangler pages dev client/build --port 8789
```

그리고 `.env.local`에서 API URL을 업데이트:

```env
REACT_APP_API_URL=http://localhost:8789/api/v1
```

### 썸네일 업로드 오류

로컬에서 썸네일 업로드를 테스트할 때:
1. Wrangler가 정상 실행 중인지 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. Network 탭에서 API 요청 상태 확인

## 참고사항

- 로컬 D1 데이터베이스는 프로덕션과 별개입니다
- 로컬에서 테스트한 데이터는 프로덕션에 영향을 주지 않습니다
- Wrangler는 로컬 D1 데이터베이스를 `.wrangler/state` 디렉토리에 저장합니다

