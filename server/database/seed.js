const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    console.log('🌱 시드 데이터 생성 시작...');

    // 관리자 계정 생성
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [adminResult] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, name, role)
       VALUES ('admin', 'admin@selledu.com', ?, '관리자', 'admin')
       ON DUPLICATE KEY UPDATE username = username`,
      [adminPassword]
    );

    // 등급 정책 생성 (구매자)
    const buyerPolicies = [
      { grade: 'BRONZE', min: 0, max: 100000, discount: 0 },
      { grade: 'SILVER', min: 100000, max: 500000, discount: 5 },
      { grade: 'GOLD', min: 500000, max: 1000000, discount: 10 },
      { grade: 'PLATINUM', min: 1000000, max: null, discount: 15 }
    ];

    for (const policy of buyerPolicies) {
      await pool.execute(
        `INSERT INTO grade_policies 
         (user_type, grade_name, min_amount, max_amount, discount_rate, period_type, period_months)
         VALUES ('buyer', ?, ?, ?, ?, 'recent', 3)
         ON DUPLICATE KEY UPDATE grade_name = grade_name`,
        [policy.grade, policy.min, policy.max, policy.discount]
      );
    }

    // 등급 정책 생성 (판매자)
    const sellerPolicies = [
      { grade: 'BRONZE', min: 0, max: 1000000, commission: 10 },
      { grade: 'SILVER', min: 1000000, max: 5000000, commission: 8 },
      { grade: 'GOLD', min: 5000000, max: 10000000, commission: 6 },
      { grade: 'PLATINUM', min: 10000000, max: null, commission: 4 }
    ];

    for (const policy of sellerPolicies) {
      await pool.execute(
        `INSERT INTO grade_policies 
         (user_type, grade_name, min_amount, max_amount, commission_rate, period_type, period_months)
         VALUES ('seller', ?, ?, ?, ?, 'recent', 3)
         ON DUPLICATE KEY UPDATE grade_name = grade_name`,
        [policy.grade, policy.min, policy.max, policy.commission]
      );
    }

    console.log('✅ 시드 데이터 생성 완료');
  } catch (error) {
    console.error('❌ 시드 데이터 생성 실패:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();


