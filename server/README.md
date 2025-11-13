# SellEdu 백엔드 API 서버

## 📋 개요

SellEdu 콘텐츠 마켓 플랫폼의 백엔드 API 서버입니다.

## 🚀 빠른 시작

### 로컬 개발 환경

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 데이터베이스 정보 입력
   ```

3. **데이터베이스 마이그레이션**
   ```bash
   npm run migrate
   ```

4. **시드 데이터 생성**
   ```bash
   npm run seed
   ```

5. **서버 실행**
   ```bash
   npm start
   # 또는 개발 모드
   npm run dev
   ```

## 📁 프로젝트 구조

```
server/
├── config/          # 설정 파일
│   └── database.js # 데이터베이스 연결 설정
├── controllers/     # 컨트롤러
│   ├── adminController.js
│   ├── contentController.js
│   └── purchaseController.js
├── database/        # 데이터베이스 관련
│   ├── migrate.js   # 마이그레이션 스크립트
│   ├── seed.js      # 시드 데이터 스크립트
│   ├── initAdmin.js # 관리자 계정 초기화
│   └── schema.sql   # 데이터베이스 스키마
├── middleware/      # 미들웨어
│   └── auth.js      # 인증 및 권한 체크
├── routes/          # 라우트
│   ├── admin.js
│   ├── auth.js
│   ├── content.js
│   ├── purchase.js
│   ├── review.js
│   ├── seller.js
│   └── index.js
├── services/        # 비즈니스 로직
│   ├── gradeService.js
│   └── settlementService.js
├── index.js         # 서버 진입점
└── package.json     # 의존성 및 스크립트
```

## 🔌 API 엔드포인트

### 인증
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인

### 콘텐츠
- `GET /api/v1/contents` - 콘텐츠 목록 조회
- `GET /api/v1/contents/:id` - 콘텐츠 상세 조회
- `POST /api/v1/contents/apply` - 콘텐츠 심사 신청 (판매자)
- `GET /api/v1/contents/seller/list` - 판매자 콘텐츠 목록
- `PUT /api/v1/contents/:id` - 콘텐츠 수정 (판매자)

### 구매
- `POST /api/v1/purchase` - 콘텐츠 구매

### 판매자
- `GET /api/v1/seller/settlement` - 정산 내역 조회
- `POST /api/v1/seller/settlement/request` - 정산 신청

### 관리자
- `GET /api/v1/admin/contents/pending` - 심사 대기 목록
- `POST /api/v1/admin/contents/:id/approve` - 콘텐츠 승인
- `POST /api/v1/admin/contents/:id/reject` - 콘텐츠 거부
- `GET /api/v1/admin/contents/approved` - 판매중 콘텐츠 목록
- `GET /api/v1/admin/reviews` - 후기 관리

### 리뷰
- `POST /api/v1/reviews` - 리뷰 작성
- `GET /api/v1/reviews` - 리뷰 목록 조회

## 🔐 인증

대부분의 API는 JWT 토큰이 필요합니다.

**요청 헤더:**
```
Authorization: Bearer {token}
```

## 📦 배포

자세한 배포 가이드는 `DEPLOY.md` 파일을 참고하세요.

### Railway 배포
1. Railway에 GitHub 저장소 연결
2. Root Directory를 `server`로 설정
3. 환경 변수 설정
4. 데이터베이스 추가 및 마이그레이션

### Render 배포
1. Render에 GitHub 저장소 연결
2. Root Directory를 `server`로 설정
3. 환경 변수 설정
4. 데이터베이스 추가 및 마이그레이션

## 🛠️ 스크립트

- `npm start` - 프로덕션 서버 시작
- `npm run dev` - 개발 서버 시작 (nodemon)
- `npm run migrate` - 데이터베이스 마이그레이션
- `npm run seed` - 시드 데이터 생성
- `npm run setup` - 마이그레이션 + 시드 데이터 생성

## 📝 환경 변수

필수 환경 변수:
- `DB_HOST` - 데이터베이스 호스트
- `DB_USER` - 데이터베이스 사용자
- `DB_PASSWORD` - 데이터베이스 비밀번호
- `DB_NAME` - 데이터베이스 이름
- `JWT_SECRET` - JWT 토큰 시크릿 키
- `PORT` - 서버 포트 (기본값: 3000)

선택적 환경 변수:
- `DB_PORT` - 데이터베이스 포트 (기본값: 3306)
- `JWT_EXPIRES_IN` - JWT 토큰 만료 시간 (기본값: 7d)
- `NODE_ENV` - 환경 (development/production)
- `API_VERSION` - API 버전 (기본값: v1)

## 🔍 Health Check

서버 상태 확인:
```
GET /health
```

응답:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

