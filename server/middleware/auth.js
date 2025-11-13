const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// JWT 토큰 검증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 사용자 정보 조회
    const [users] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: '유효하지 않은 사용자입니다.' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
    return res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
};

// 역할 기반 권한 체크
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    next();
  };
};

// API 호출 로그 기록
const logApiCall = async (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      await pool.execute(
        `INSERT INTO api_logs (user_id, endpoint, method, ip_address, response_status, response_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user?.id || null,
          req.path,
          req.method,
          req.ip,
          res.statusCode,
          responseTime
        ]
      );
    } catch (error) {
      console.error('API 로그 기록 실패:', error);
    }
  });

  next();
};

module.exports = {
  authenticate,
  authorize,
  logApiCall
};


