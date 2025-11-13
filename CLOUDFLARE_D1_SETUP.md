# Cloudflare D1 데이터베이스 설정 가이드

## 1. D1 데이터베이스 생성

1. Cloudflare 대시보드에 로그인: https://dash.cloudflare.com
2. Workers & Pages > D1 메뉴로 이동
3. "Create database" 버튼 클릭
4. 데이터베이스 이름: `selledu-db` 입력
5. "Create" 클릭

## 2. 데이터베이스 ID 확인

1. 생성된 데이터베이스를 클릭
2. Settings 탭에서 "Database ID" 복사
3. `wrangler.toml` 파일의 `database_id`에 붙여넣기

## 3. 스키마 적용

### 방법 1: Cloudflare 대시보드에서 직접 실행

1. D1 데이터베이스 페이지로 이동
2. "Console" 탭 클릭
3. `d1-schema.sql` 파일의 내용을 복사하여 실행

### 방법 2: Wrangler CLI 사용

```bash
# Wrangler 설치 (아직 설치하지 않은 경우)
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# 스키마 적용
wrangler d1 execute selledu-db --file=./d1-schema.sql
```

## 4. 환경 변수 설정 (Cloudflare Pages)

1. Cloudflare 대시보드 > Pages > 프로젝트 선택
2. Settings > Environment variables
3. 다음 변수 추가:
   - `JWT_SECRET`: JWT 토큰 서명용 시크릿 키 (랜덤 문자열 권장)

## 5. D1 바인딩 설정 (Cloudflare Pages)

1. Cloudflare 대시보드 > Pages > 프로젝트 선택
2. Settings > Functions
3. D1 Database bindings 섹션에서:
   - Variable name: `DB`
   - D1 Database: `selledu-db` 선택
4. Save

## 6. 관리자 계정 생성

D1 데이터베이스 콘솔에서 다음 SQL 실행:

```sql
-- 비밀번호: admin (SHA-256 해시)
-- 실제 해시값은 Cloudflare Functions에서 생성된 값 사용
-- 또는 다음 명령으로 생성:
-- echo -n "admin" | shasum -a 256

INSERT INTO users (username, email, password_hash, name, role, created_at, updated_at)
VALUES (
  'admin',
  'admin@selledu.com',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', -- admin의 SHA-256 해시
  '관리자',
  'admin',
  datetime('now'),
  datetime('now')
);
```

## 7. 배포 확인

1. GitHub에 푸시하면 Cloudflare Pages가 자동으로 배포됩니다
2. 배포 후 `/api/auth/register`와 `/api/auth/login` 엔드포인트가 작동하는지 확인

## 문제 해결

### D1 데이터베이스 연결 오류
- `wrangler.toml`의 `database_id`가 올바른지 확인
- Cloudflare Pages의 D1 바인딩이 올바르게 설정되었는지 확인

### 함수 실행 오류
- Cloudflare Pages Functions는 `functions/` 디렉토리에 있어야 합니다
- TypeScript 파일은 자동으로 컴파일됩니다

### 인증 오류
- JWT_SECRET 환경 변수가 설정되었는지 확인
- 토큰이 올바르게 생성되고 전달되는지 확인

