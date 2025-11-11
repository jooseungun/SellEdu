# SellEdu - 콘텐츠 마켓 플랫폼

누구나 자신의 콘텐츠를 업로드하고 판매할 수 있는 콘텐츠 마켓 플랫폼입니다.

## 주요 기능

### 구매자
- 로그인 없이 콘텐츠 탐색 가능
- 콘텐츠 구매 및 결제
- 구매 이력 조회
- 자동 등급 관리 (구매 금액에 따른 할인율 자동 적용)

### 판매자
- 콘텐츠 업로드 및 심사 신청
- 판매 현황 대시보드
- 정산 신청 및 내역 조회
- 자동 등급 관리 (판매 실적에 따른 수수료율 자동 조정)

### 관리자
- 회원 관리
- 콘텐츠 승인/거부
- 정산 관리
- 등급 정책 설정 및 관리

## 기술 스택

### Backend
- Node.js + Express
- MySQL
- JWT 인증
- 자동 등급 관리 시스템
- 정산 시스템

### Frontend
- React
- Material-UI
- React Router

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/jooseungun/SellEdu.git
cd SellEdu
```

### 2. Backend 설정

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 데이터베이스 정보 수정

# 데이터베이스 마이그레이션
npm run db:migrate

# 시드 데이터 생성
npm run db:seed

# 서버 실행
npm run server:dev
```

### 3. Frontend 설정

```bash
cd client
npm install
npm start
```

### 4. 전체 실행 (Backend + Frontend)

```bash
# 프로젝트 루트에서
npm run dev
```

## 환경 변수 설정

`.env` 파일에 다음 정보를 설정하세요:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=selledu

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
```

## API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인

### 콘텐츠 (구매자)
- `GET /api/v1/contents` - 콘텐츠 목록 조회
- `GET /api/v1/contents/:id` - 콘텐츠 상세 조회

### 구매
- `POST /api/v1/purchase` - 콘텐츠 구매
- `GET /api/v1/purchase/history` - 구매 이력 조회

### 판매자
- `POST /api/v1/contents/apply` - 콘텐츠 심사 신청
- `GET /api/v1/contents/seller/list` - 판매 중인 콘텐츠 목록
- `GET /api/v1/seller/settlement` - 정산 내역 조회
- `POST /api/v1/seller/settlement/request` - 정산 신청

### 관리자
- `POST /api/v1/admin/contents/:id/approve` - 콘텐츠 승인
- `POST /api/v1/admin/contents/:id/reject` - 콘텐츠 거부
- `POST /api/v1/admin/settlements/:id/complete` - 정산 완료 처리
- `GET /api/v1/admin/grade-policies` - 등급 정책 조회
- `POST /api/v1/admin/grade-policies` - 등급 정책 생성

## 주요 개선사항 반영

### 1. 데이터베이스 설계 개선
- ✅ 구매자/판매자 테이블 분리 (FK로 통합)
- ✅ 정산 이력 테이블 추가 (중복 정산 방지)
- ✅ 등급 변경 이력 테이블 추가
- ✅ API 호출 로그 테이블 추가

### 2. 자동 등급 관리 시스템
- ✅ 구매자 등급 자동 업데이트 (구매 금액 기준)
- ✅ 판매자 등급 자동 업데이트 (판매 실적 기준)
- ✅ 등급별 할인율/수수료율 자동 적용
- ✅ 등급 변경 이력 기록

### 3. 정산 시스템
- ✅ 정산 시점별 누적 관리
- ✅ 중복 정산 방지 로직
- ✅ 정산 이력 관리

### 4. 보안 강화
- ✅ JWT 인증
- ✅ API 호출 로그 기록
- ✅ 역할 기반 권한 체크

## 프로젝트 구조

```
SellEdu/
├── server/
│   ├── config/          # 설정 파일
│   ├── controllers/     # 컨트롤러
│   ├── database/        # 데이터베이스 스키마 및 마이그레이션
│   ├── middleware/      # 미들웨어 (인증, 로깅 등)
│   ├── routes/         # 라우트 정의
│   ├── services/       # 비즈니스 로직 (등급 관리, 정산 등)
│   └── index.js        # 서버 진입점
├── client/
│   ├── src/
│   │   ├── components/ # React 컴포넌트
│   │   ├── pages/      # 페이지 컴포넌트
│   │   └── utils/      # 유틸리티 함수
│   └── public/
└── package.json
```

## 개발 로드맵

### 1단계 (MVP) ✅
- [x] 기본 구매/판매 기능
- [x] 관리자 콘텐츠 승인
- [x] 기본 정산 시스템

### 2단계 (진행 중)
- [x] 자동 등급 관리
- [ ] 외부 연동 (LMS/CMS)
- [ ] 리뷰 시스템

### 3단계 (예정)
- [ ] 추천 알고리즘
- [ ] 구독제
- [ ] 통계 대시보드

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다!
