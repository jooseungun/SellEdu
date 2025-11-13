-- 기존 테이블에 필드 추가하는 마이그레이션
-- 이미 테이블이 생성된 경우 이 스크립트를 실행하세요

ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS content_area VARCHAR(50) DEFAULT 'default' AFTER display_order,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT AFTER preview_duration,
ADD COLUMN IF NOT EXISTS is_reapply BOOLEAN DEFAULT FALSE AFTER rejection_reason,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL AFTER approved_at;

ALTER TABLE contents 
ADD INDEX IF NOT EXISTS idx_content_area (content_area),
ADD INDEX IF NOT EXISTS idx_is_reapply (is_reapply);

