# 데이터베이스 테이블 생성 빠른 해결 방법

## 방법 1: API 엔드포인트 사용 (가장 빠름)

브라우저 콘솔에서 다음 명령 실행:

```javascript
fetch('https://selledu.pages.dev/api/v1/admin/init-db', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('성공:', data);
  alert('데이터베이스 초기화 완료! 이제 로그인할 수 있습니다.');
})
.catch(err => {
  console.error('오류:', err);
  alert('오류 발생: ' + err.message);
});
```

또는 브라우저 주소창에 직접 입력:
```
https://selledu.pages.dev/api/v1/admin/init-db
```
(POST 요청이므로 브라우저에서 직접 접근은 안 됩니다. 위의 JavaScript 코드를 사용하세요)

## 방법 2: Cloudflare 대시보드에서 직접 실행

1. **Cloudflare 대시보드** > **Workers & Pages** > **D1**
2. `selledu-db` 데이터베이스 선택
3. **Console** 탭 클릭
4. 다음 SQL을 복사하여 실행:

```sql
-- users 테이블 생성
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

-- buyers 테이블 생성
CREATE TABLE IF NOT EXISTS buyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    grade TEXT DEFAULT 'BRONZE',
    discount_rate REAL DEFAULT 0.00,
    total_purchase_amount REAL DEFAULT 0.00,
    recent_purchase_amount REAL DEFAULT 0.00,
    recent_months INTEGER DEFAULT 3,
    last_grade_update TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_buyer_user_id ON buyers(user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_grade ON buyers(grade);

-- sellers 테이블 생성
CREATE TABLE IF NOT EXISTS sellers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    grade TEXT DEFAULT 'BRONZE',
    commission_rate REAL DEFAULT 10.00,
    total_sales_amount REAL DEFAULT 0.00,
    recent_sales_amount REAL DEFAULT 0.00,
    recent_months INTEGER DEFAULT 3,
    last_grade_update TEXT,
    bank_name TEXT,
    account_number TEXT,
    account_holder TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seller_user_id ON sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_grade ON sellers(grade);

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

5. **Run** 버튼 클릭

## 방법 3: 프로젝트의 SQL 파일 사용

프로젝트 루트에 있는 `d1-schema-simple.sql` 파일의 내용을 복사하여 D1 Console에 붙여넣고 실행하세요.

## 확인 방법

테이블이 생성되었는지 확인:

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

다음 테이블들이 보여야 합니다:
- users
- buyers
- sellers

관리자 계정이 생성되었는지 확인:

```sql
SELECT username, email, role FROM users WHERE username = 'admin';
```

## 로그인 테스트

1. `https://selledu.pages.dev/login` 접속
2. 다음 계정으로 로그인:
   - **아이디**: `admin`
   - **비밀번호**: `admin`

## 문제 해결

### "D1 데이터베이스 바인딩이 설정되지 않았습니다" 오류
- Cloudflare Pages > Settings > Functions > D1 Database bindings 확인
- Variable name: `DB`, Database: `selledu-db` 설정 확인

### 테이블이 생성되지 않는 경우
- SQL 구문 오류 확인
- D1 Console에서 에러 메시지 확인
- 각 CREATE TABLE 문을 하나씩 실행해보기

