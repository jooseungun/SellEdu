-- SellEdu Database Schema
-- 개선사항 반영: 테이블 분리, 정산 이력 관리, 등급 이력 관리

-- 회원 기본 정보 테이블
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    birth_date DATE,
    phone VARCHAR(20),
    mobile VARCHAR(20),
    role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 구매자 정보 테이블 (개선: 테이블 분리)
CREATE TABLE IF NOT EXISTS buyers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    grade VARCHAR(20) DEFAULT 'BRONZE',
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    total_purchase_amount DECIMAL(12,2) DEFAULT 0.00,
    recent_purchase_amount DECIMAL(12,2) DEFAULT 0.00,
    recent_months INT DEFAULT 3,
    last_grade_update TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 판매자 정보 테이블 (개선: 테이블 분리)
CREATE TABLE IF NOT EXISTS sellers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    grade VARCHAR(20) DEFAULT 'BRONZE',
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    total_sales_amount DECIMAL(12,2) DEFAULT 0.00,
    recent_sales_amount DECIMAL(12,2) DEFAULT 0.00,
    recent_months INT DEFAULT 3,
    last_grade_update TIMESTAMP,
    bank_name VARCHAR(50),
    account_number VARCHAR(50),
    account_holder VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_grade (grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 등급 정책 테이블 (개선: 등급 관리 자동화)
CREATE TABLE IF NOT EXISTS grade_policies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_type ENUM('buyer', 'seller') NOT NULL,
    grade_name VARCHAR(20) NOT NULL,
    min_amount DECIMAL(12,2) NOT NULL,
    max_amount DECIMAL(12,2),
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    period_type ENUM('total', 'recent') DEFAULT 'recent',
    period_months INT DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_grade (user_type, grade_name),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 등급 변경 이력 테이블 (개선: 등급 이력 관리)
CREATE TABLE IF NOT EXISTS grade_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    user_type ENUM('buyer', 'seller') NOT NULL,
    old_grade VARCHAR(20),
    new_grade VARCHAR(20) NOT NULL,
    reason TEXT,
    amount DECIMAL(12,2),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS contents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    cdn_link VARCHAR(500) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration INT DEFAULT 0,
    tags JSON,
    status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending',
    display_order INT DEFAULT 0,
    sale_start_date DATETIME,
    sale_end_date DATETIME,
    is_always_on_sale BOOLEAN DEFAULT FALSE,
    preview_duration INT DEFAULT 600,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    INDEX idx_seller_id (seller_id),
    INDEX idx_status (status),
    INDEX idx_content_hash (content_hash),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 콘텐츠 차시 테이블
CREATE TABLE IF NOT EXISTS content_lessons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    content_id INT NOT NULL,
    lesson_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    cdn_link VARCHAR(500) NOT NULL,
    duration INT DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_content_id (content_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 구매 내역 테이블
CREATE TABLE IF NOT EXISTS purchases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,
    content_id INT NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_price DECIMAL(10,2) NOT NULL,
    discount_rate DECIMAL(5,2) DEFAULT 0.00,
    payment_method VARCHAR(50),
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    INDEX idx_buyer_id (buyer_id),
    INDEX idx_content_id (content_id),
    INDEX idx_purchased_at (purchased_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정산 내역 테이블 (개선: 정산 시점별 누적 관리)
CREATE TABLE IF NOT EXISTS settlements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    content_id INT NOT NULL,
    purchase_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    seller_amount DECIMAL(10,2) NOT NULL,
    settlement_status ENUM('pending', 'requested', 'completed', 'cancelled') DEFAULT 'pending',
    settlement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    INDEX idx_seller_id (seller_id),
    INDEX idx_settlement_status (settlement_status),
    INDEX idx_settlement_date (settlement_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 정산 이력 테이블 (개선: 중복 정산 방지)
CREATE TABLE IF NOT EXISTS settlement_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seller_id INT NOT NULL,
    settlement_period_start DATE NOT NULL,
    settlement_period_end DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    total_commission DECIMAL(12,2) NOT NULL,
    seller_amount DECIMAL(12,2) NOT NULL,
    settlement_count INT DEFAULT 0,
    settlement_status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    settlement_document_url VARCHAR(500),
    requested_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_settlement_period (seller_id, settlement_period_start, settlement_period_end),
    INDEX idx_seller_id (seller_id),
    INDEX idx_settlement_status (settlement_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    buyer_id INT NOT NULL,
    content_id INT NOT NULL,
    purchase_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (buyer_id, content_id),
    INDEX idx_content_id (content_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- API 호출 로그 테이블 (개선: 보안 및 모니터링)
CREATE TABLE IF NOT EXISTS api_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45),
    request_body JSON,
    response_status INT,
    response_time INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_endpoint (endpoint),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


