const pool = require('../config/database');
const bcrypt = require('bcryptjs');

async function initAdmin() {
  try {
    // 관리자 계정이 있는지 확인
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? AND role = ?',
      ['admin', 'admin']
    );

    const adminPassword = await bcrypt.hash('admin', 10);

    if (existing.length === 0) {
      // 관리자 계정 생성
      await pool.execute(
        `INSERT INTO users (username, email, password_hash, name, role, mobile)
         VALUES ('admin', 'admin@selledu.com', ?, '관리자', 'admin', '010-0000-0000')`,
        [adminPassword]
      );
      console.log('✅ 관리자 계정 생성 완료 (admin/admin)');
    } else {
      // 관리자 비밀번호 업데이트
      await pool.execute(
        `UPDATE users SET password_hash = ? WHERE username = 'admin' AND role = 'admin'`,
        [adminPassword]
      );
      console.log('✅ 관리자 비밀번호 업데이트 완료 (admin/admin)');
    }
  } catch (error) {
    console.error('❌ 관리자 계정 초기화 실패:', error);
    console.error('에러 상세:', error.message);
    // 에러가 발생해도 서버는 계속 실행되도록 함
  }
}

module.exports = initAdmin;

