# Cloudflare D1 데이터베이스 스키마 적용 가이드

## 방법 1: Cloudflare 대시보드에서 직접 실행 (권장)

### 1단계: D1 데이터베이스 생성
1. https://dash.cloudflare.com 접속
2. 왼쪽 메뉴에서 **Workers & Pages** 클릭
3. **D1** 메뉴 클릭
4. **Create database** 버튼 클릭
5. 데이터베이스 이름: `selledu-db` 입력
6. **Create** 클릭

### 2단계: 스키마 적용
1. 생성된 `selledu-db` 데이터베이스를 클릭
2. 상단 탭에서 **Console** 클릭
3. 아래 SQL 스크립트를 복사하여 콘솔에 붙여넣기
4. **Run** 버튼 클릭

---

## 간단 버전 스키마 (인증 기능용)

```sql
-- Cloudflare D1 Database Schema for SellEdu (간단 버전)
-- 필수 테이블만 포함 (인증 및 기본 기능용)

-- ============================================
-- 1. 회원 기본 정보 테이블
-- ============================================
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

-- ============================================
-- 2. 구매자 정보 테이블
-- ============================================
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

-- ============================================
-- 3. 판매자 정보 테이블
-- ============================================
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

-- ============================================
-- 관리자 계정 생성 (비밀번호: admin)
-- ============================================
-- SHA-256 해시: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
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

---

## 완전 버전 스키마 (모든 기능용)

완전 버전은 `d1-schema.sql` 파일을 참고하세요. 파일이 너무 길어서 여기에는 포함하지 않았습니다.

---

## 방법 2: Wrangler CLI 사용 (Node.js 설치 필요)

### 사전 요구사항
- Node.js 18 이상 설치
- npm 설치

### 설치 및 실행
```bash
# Wrangler 전역 설치
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# 데이터베이스 목록 확인
wrangler d1 list

# 간단 버전 스키마 적용
wrangler d1 execute selledu-db --file=./d1-schema-simple.sql

# 또는 완전 버전 스키마 적용
wrangler d1 execute selledu-db --file=./d1-schema.sql
```

---

## 3단계: Cloudflare Pages에 D1 바인딩 추가

1. Cloudflare 대시보드 > **Pages** 메뉴
2. `SellEdu` 프로젝트 선택
3. **Settings** 탭 클릭
4. 왼쪽 메뉴에서 **Functions** 클릭
5. **D1 Database bindings** 섹션에서:
   - **Variable name**: `DB` 입력
   - **D1 Database**: `selledu-db` 선택
6. **Save** 버튼 클릭

---

## 4단계: 데이터베이스 ID 확인 및 wrangler.toml 업데이트

1. D1 데이터베이스 페이지로 이동
2. **Settings** 탭 클릭
3. **Database ID** 복사
4. 프로젝트의 `wrangler.toml` 파일에서 `YOUR_D1_DATABASE_ID`를 실제 ID로 변경

---

## 확인 방법

스키마가 제대로 적용되었는지 확인:

1. D1 데이터베이스 > **Console** 탭
2. 다음 SQL 실행:
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

다음 테이블들이 보여야 합니다:
- users
- buyers
- sellers

---

## 문제 해결

### 테이블이 생성되지 않는 경우
- SQL 구문 오류가 없는지 확인
- 콘솔에서 에러 메시지 확인
- 각 CREATE TABLE 문을 하나씩 실행해보기

### 외래 키 오류
- SQLite는 외래 키가 기본적으로 비활성화되어 있을 수 있습니다
- D1에서는 외래 키가 자동으로 활성화되어 있습니다

### 관리자 계정 로그인 실패
- 비밀번호는 `admin`입니다
- SHA-256 해시가 올바르게 저장되었는지 확인:
```sql
SELECT username, password_hash FROM users WHERE username = 'admin';
```

