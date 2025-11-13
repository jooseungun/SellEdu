-- Cloudflare D1 Database Schema for SellEdu - Contents Tables
-- 콘텐츠 관련 테이블 추가

-- ============================================
-- 4. 콘텐츠 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    detailed_description TEXT,
    thumbnail_url TEXT,
    price REAL DEFAULT 0.00,
    category TEXT NOT NULL,
    grade TEXT DEFAULT '베이직' CHECK(grade IN ('베이직', '프리미엄', '스탠다드', '개별구매')),
    age_rating TEXT DEFAULT 'All' CHECK(age_rating IN ('All', '15', '18')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
    display_order INTEGER DEFAULT 0,
    content_area TEXT DEFAULT 'default',
    purchase_count INTEGER DEFAULT 0,
    avg_rating REAL DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    education_period INTEGER DEFAULT 0,
    rejection_reason TEXT,
    is_reapply INTEGER DEFAULT 0,
    rejected_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    approved_at TEXT,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_content_seller_id ON contents(seller_id);
CREATE INDEX IF NOT EXISTS idx_content_category ON contents(category);
CREATE INDEX IF NOT EXISTS idx_content_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_content_display_order ON contents(display_order);

-- ============================================
-- 5. 콘텐츠 강의 차시 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS content_lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cdn_link TEXT,
    duration INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_content_id ON content_lessons(content_id);
CREATE INDEX IF NOT EXISTS idx_lesson_display_order ON content_lessons(display_order);

-- ============================================
-- 6. 강사 정보 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    profile TEXT,
    profile_image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_instructor_user_id ON instructors(user_id);

-- ============================================
-- 7. 콘텐츠-강사 연결 테이블
-- ============================================
CREATE TABLE IF NOT EXISTS content_instructors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE,
    UNIQUE(content_id, instructor_id)
);

CREATE INDEX IF NOT EXISTS idx_content_instructor_content ON content_instructors(content_id);
CREATE INDEX IF NOT EXISTS idx_content_instructor_instructor ON content_instructors(instructor_id);

