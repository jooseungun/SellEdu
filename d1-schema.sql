-- Cloudflare D1 Database Schema for SellEdu
-- SQLite 기반 완전한 스키마
-- 모든 테이블과 인덱스 포함

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
-- 4. 등급 정책 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS grade_policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type TEXT NOT NULL CHECK(user_type IN ('buyer', 'seller')),
    grade_name TEXT NOT NULL,
    min_amount REAL NOT NULL,
    max_amount REAL,
    discount_rate REAL DEFAULT 0.00,
    commission_rate REAL DEFAULT 10.00,
    period_type TEXT DEFAULT 'recent' CHECK(period_type IN ('total', 'recent')),
    period_months INTEGER DEFAULT 3,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_type, grade_name)
);

CREATE INDEX IF NOT EXISTS idx_grade_policy_user_type ON grade_policies(user_type);

-- ============================================
-- 5. 등급 변경 이력 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS grade_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('buyer', 'seller')),
    old_grade TEXT,
    new_grade TEXT NOT NULL,
    reason TEXT,
    amount REAL,
    changed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_grade_history_user_id ON grade_history(user_id);
CREATE INDEX IF NOT EXISTS idx_grade_history_changed_at ON grade_history(changed_at);

-- ============================================
-- 6. 콘텐츠 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    cdn_link TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    price REAL NOT NULL,
    duration INTEGER DEFAULT 0,
    tags TEXT, -- JSON stored as TEXT
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
    display_order INTEGER DEFAULT 0,
    content_area TEXT DEFAULT 'default',
    sale_start_date TEXT,
    sale_end_date TEXT,
    is_always_on_sale INTEGER DEFAULT 0 CHECK(is_always_on_sale IN (0, 1)),
    preview_duration INTEGER DEFAULT 600,
    rejection_reason TEXT,
    is_reapply INTEGER DEFAULT 0 CHECK(is_reapply IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    approved_at TEXT,
    rejected_at TEXT,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contents_seller_id ON contents(seller_id);
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_content_hash ON contents(content_hash);
CREATE INDEX IF NOT EXISTS idx_contents_display_order ON contents(display_order);
CREATE INDEX IF NOT EXISTS idx_contents_content_area ON contents(content_area);

-- ============================================
-- 7. 콘텐츠 차시 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS content_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    cdn_link TEXT NOT NULL,
    duration INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_lessons_content_id ON content_lessons(content_id);

-- ============================================
-- 8. 구매 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    original_price REAL NOT NULL,
    discount_amount REAL DEFAULT 0.00,
    final_price REAL NOT NULL,
    discount_rate REAL DEFAULT 0.00,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    purchased_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_content_id ON purchases(content_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON purchases(purchased_at);

-- ============================================
-- 9. 정산 내역 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    purchase_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    commission_rate REAL NOT NULL,
    commission_amount REAL NOT NULL,
    seller_amount REAL NOT NULL,
    settlement_status TEXT DEFAULT 'pending' CHECK(settlement_status IN ('pending', 'requested', 'completed', 'cancelled')),
    settlement_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_settlement_status ON settlements(settlement_status);
CREATE INDEX IF NOT EXISTS idx_settlements_settlement_date ON settlements(settlement_date);

-- ============================================
-- 10. 정산 이력 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS settlement_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    settlement_period_start TEXT NOT NULL,
    settlement_period_end TEXT NOT NULL,
    total_amount REAL NOT NULL,
    total_commission REAL NOT NULL,
    seller_amount REAL NOT NULL,
    settlement_count INTEGER DEFAULT 0,
    settlement_status TEXT DEFAULT 'pending' CHECK(settlement_status IN ('pending', 'processing', 'completed', 'cancelled')),
    settlement_document_url TEXT,
    requested_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    UNIQUE(seller_id, settlement_period_start, settlement_period_end)
);

CREATE INDEX IF NOT EXISTS idx_settlement_history_seller_id ON settlement_history(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlement_history_settlement_status ON settlement_history(settlement_status);

-- ============================================
-- 11. 리뷰 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    buyer_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    purchase_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    UNIQUE(buyer_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- ============================================
-- 12. 알림 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0 CHECK(is_read IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- 13. API 호출 로그 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    ip_address TEXT,
    request_body TEXT, -- JSON stored as TEXT
    response_status INTEGER,
    response_time INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);

-- ============================================
-- 초기 데이터 삽입 (선택사항)
-- ============================================

-- 기본 등급 정책 데이터 (구매자)
INSERT OR IGNORE INTO grade_policies (user_type, grade_name, min_amount, max_amount, discount_rate, period_type, period_months, is_active)
VALUES
    ('buyer', 'BRONZE', 0, 100000, 0.00, 'recent', 3, 1),
    ('buyer', 'SILVER', 100000, 500000, 5.00, 'recent', 3, 1),
    ('buyer', 'GOLD', 500000, 1000000, 10.00, 'recent', 3, 1),
    ('buyer', 'PLATINUM', 1000000, NULL, 15.00, 'recent', 3, 1);

-- 기본 등급 정책 데이터 (판매자)
INSERT OR IGNORE INTO grade_policies (user_type, grade_name, min_amount, max_amount, commission_rate, period_type, period_months, is_active)
VALUES
    ('seller', 'BRONZE', 0, 1000000, 15.00, 'recent', 3, 1),
    ('seller', 'SILVER', 1000000, 5000000, 12.00, 'recent', 3, 1),
    ('seller', 'GOLD', 5000000, 20000000, 10.00, 'recent', 3, 1),
    ('seller', 'PLATINUM', 20000000, NULL, 8.00, 'recent', 3, 1);

-- 관리자 계정 생성 (비밀번호: admin)
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
