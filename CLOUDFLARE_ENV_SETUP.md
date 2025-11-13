# Cloudflare D1 환경변수 설정 가이드

## 1. 로컬 개발 환경 설정

### .env 파일 생성
1. 프로젝트 루트 디렉토리에 `.env.local` 파일 생성
2. `.env.local.example` 파일을 참고하여 값 입력

```bash
# .env.local 파일 예시
D1_DATABASE_ID=your-database-id
D1_DATABASE_NAME=selledu-db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
REACT_APP_API_URL=http://localhost:3000/api/v1
NODE_ENV=development
```

### 주의사항
- `.env.local` 파일은 Git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- 실제 시크릿 키는 절대 공개 저장소에 올리지 마세요

---

## 2. Cloudflare Pages 프로덕션 환경 설정

### Cloudflare 대시보드에서 환경변수 설정

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com

2. **Pages 프로젝트 선택**
   - Workers & Pages > Pages
   - `SellEdu` 프로젝트 선택

3. **Settings > Environment variables** 클릭

4. **환경변수 추가**
   - Production 환경과 Preview 환경 모두 설정 가능

#### 필수 환경변수

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `JWT_SECRET` | 랜덤 문자열 | JWT 토큰 서명용 시크릿 키 |

#### JWT_SECRET 생성 방법

**방법 1: OpenSSL 사용**
```bash
openssl rand -hex 32
```

**방법 2: Node.js 사용**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**방법 3: 온라인 생성기**
- https://randomkeygen.com/ 사용

#### 환경변수 추가 예시

1. **Variable name**: `JWT_SECRET`
2. **Value**: 생성한 랜덤 문자열 입력
3. **Environment**: Production 선택 (또는 All environments)
4. **Encrypt**: 체크 (권장)
5. **Save** 클릭

---

## 3. D1 데이터베이스 바인딩 설정

### Cloudflare Pages Functions에서 D1 바인딩

1. **Pages 프로젝트 > Settings > Functions** 클릭

2. **D1 Database bindings** 섹션에서:
   - **Variable name**: `DB` (함수에서 사용할 변수명)
   - **D1 Database**: `selledu-db` 선택
   - **Save** 클릭

### wrangler.toml 설정

`wrangler.toml` 파일에서 D1 데이터베이스 ID를 설정:

```toml
[[d1_databases]]
binding = "DB"
database_name = "selledu-db"
database_id = "YOUR_D1_DATABASE_ID"  # 실제 ID로 변경 필요
```

**데이터베이스 ID 확인 방법:**
1. Cloudflare 대시보드 > Workers & Pages > D1
2. `selledu-db` 데이터베이스 선택
3. Settings 탭 > Database ID 복사

---

## 4. 환경변수 확인

### 로컬 개발 환경
```bash
# .env.local 파일 확인
cat .env.local
```

### Cloudflare Pages 환경
1. Pages 프로젝트 > Settings > Environment variables
2. 설정된 환경변수 목록 확인

---

## 5. 보안 주의사항

### ✅ 해야 할 것
- `.env.local` 파일을 `.gitignore`에 포함
- 프로덕션 환경변수는 Cloudflare 대시보드에서만 관리
- JWT_SECRET은 강력한 랜덤 문자열 사용
- 환경변수는 암호화하여 저장 (Cloudflare 대시보드 옵션)

### ❌ 하지 말아야 할 것
- `.env` 파일을 Git에 커밋
- 환경변수를 코드에 하드코딩
- 프로덕션 시크릿 키를 공개 저장소에 업로드
- 약한 비밀번호를 JWT_SECRET으로 사용

---

## 6. 문제 해결

### 환경변수가 적용되지 않는 경우
1. Cloudflare Pages 재배포 확인
2. 환경변수 이름이 정확한지 확인 (대소문자 구분)
3. Functions에서 `env` 객체를 통해 접근하는지 확인

### D1 데이터베이스 연결 오류
1. D1 바인딩이 올바르게 설정되었는지 확인
2. `wrangler.toml`의 `database_id`가 올바른지 확인
3. 데이터베이스 이름이 일치하는지 확인

### JWT 토큰 오류
1. `JWT_SECRET` 환경변수가 설정되었는지 확인
2. 로그인/회원가입 시 동일한 시크릿 키 사용 확인
3. 토큰 만료 시간 확인

---

## 7. 환경변수 사용 예시

### Cloudflare Pages Functions에서 사용

```typescript
// functions/api/auth/login.ts
export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    JWT_SECRET?: string;
  };
}): Promise<Response> {
  // env.JWT_SECRET 사용
  const secret = env.JWT_SECRET || 'default-secret';
  
  // env.DB 사용
  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(username)
    .first();
  
  // ...
}
```

### React 앱에서 사용

```javascript
// client/src/utils/api.js
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // ...
};
```

---

## 참고 자료

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Cloudflare Pages Functions 문서](https://developers.cloudflare.com/pages/platform/functions/)
- [환경변수 관리 가이드](https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables)

