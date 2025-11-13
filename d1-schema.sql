-- Cloudflare D1 Database Schema for SellEdu
-- SQLite 기반 스키마

-- 회원 기본 정보 테이블
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

-- 구매자 정보 테이블
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

-- 판매자 정보 테이블
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

