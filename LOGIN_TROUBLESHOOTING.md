# 로그인 500 에러 해결 가이드

## 1. D1 데이터베이스 바인딩 확인

Cloudflare Pages 대시보드에서 D1 바인딩이 제대로 설정되어 있는지 확인:

1. **Cloudflare 대시보드** > **Pages** > **SellEdu** 프로젝트 선택
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Functions** 클릭
4. **D1 Database bindings** 섹션 확인:
   - **Variable name**: `DB` (대소문자 구분)
   - **D1 Database**: `selledu-db` 선택되어 있어야 함
5. 설정되어 있지 않다면 추가하고 **Save** 클릭

## 2. D1 데이터베이스 스키마 확인

D1 데이터베이스에 `users` 테이블이 생성되어 있는지 확인:

1. **Cloudflare 대시보드** > **Workers & Pages** > **D1**
2. `selledu-db` 데이터베이스 선택
3. **Console** 탭 클릭
4. 다음 SQL 실행:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='users';
```

결과가 나오지 않으면 스키마를 적용해야 합니다.

## 3. 스키마 적용 (테이블이 없는 경우)

### 방법 1: Cloudflare 대시보드에서 직접 실행

1. D1 데이터베이스 > **Console** 탭
2. `d1-schema-simple.sql` 파일의 내용을 복사하여 실행
3. 또는 다음 SQL을 직접 실행:

```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    birth_date TEXT,
    phone TEXT,
    mobile TEXT,
    role TEXT DEFAULT 'buyer' CHECK(role IN ('buyer', 'seller', 'admin')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_email ON users(email);

-- 관리자 계정 생성 (비밀번호: admin)
INSERT OR IGNORE INTO users (username, email, password_hash, name, role, created_at, updated_at)
VALUES (
    'admin',
    'admin@selledu.com',
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    '관리자',
    'admin',
    datetime('now'),
    datetime('now')
);
```

### 방법 2: Wrangler CLI 사용

```bash
wrangler d1 execute selledu-db --file=./d1-schema-simple.sql
```

## 4. 관리자 계정 확인

관리자 계정이 생성되어 있는지 확인:

1. D1 데이터베이스 > **Console** 탭
2. 다음 SQL 실행:
```sql
SELECT username, email, role FROM users WHERE username = 'admin';
```

결과가 나와야 합니다.

## 5. 에러 메시지 확인

로그인 시도 후 브라우저 콘솔에서 에러 메시지를 확인:

- **"데이터베이스 연결에 실패했습니다"**: D1 바인딩이 설정되지 않음
- **"데이터베이스 테이블이 없습니다"**: users 테이블이 생성되지 않음
- **"데이터베이스 조회 중 오류가 발생했습니다"**: SQL 쿼리 오류

## 6. Cloudflare Pages 재배포

설정을 변경한 후에는 재배포가 필요할 수 있습니다:

1. **Pages** > **SellEdu** 프로젝트
2. **Deployments** 탭
3. 최신 배포의 **Retry deployment** 클릭

## 7. 테스트

1. 브라우저에서 `https://selledu.pages.dev/login` 접속
2. 다음 계정으로 로그인 시도:
   - **아이디**: `admin`
   - **비밀번호**: `admin`

## 문제가 계속되는 경우

1. Cloudflare 대시보드 > **Pages** > **SellEdu** > **Functions** > **Logs** 확인
2. 에러 로그에서 상세한 오류 메시지 확인
3. `wrangler.toml` 파일의 `database_id`가 올바른지 확인

