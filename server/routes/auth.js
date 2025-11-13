const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// 회원가입
router.post(
  '/register',
  [
    body('username').notEmpty().withMessage('아이디는 필수입니다.'),
    body('email').isEmail().withMessage('유효한 이메일을 입력해주세요.'),
    body('password').isLength({ min: 6 }).withMessage('비밀번호는 최소 6자 이상이어야 합니다.'),
    body('name').notEmpty().withMessage('이름은 필수입니다.')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: errors.array().map(e => e.msg).join(', '),
          errors: errors.array()
        });
      }

      const { username, email, password, name, birth_date, phone, mobile, role } = req.body;

      // 중복 확인
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: '이미 사용 중인 아이디 또는 이메일입니다.' });
      }

      // 비밀번호 해시
      const passwordHash = await bcrypt.hash(password, 10);

      // 사용자 생성
      const [result] = await pool.execute(
        `INSERT INTO users (username, email, password_hash, name, birth_date, phone, mobile, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, passwordHash, name, birth_date || null, phone || null, mobile || null, role || 'buyer']
      );

      const userId = result.insertId;

      // 구매자/판매자 정보 생성 (관리자는 제외)
      if (role !== 'admin') {
        if (role === 'buyer' || !role) {
          await pool.execute(
            'INSERT INTO buyers (user_id) VALUES (?)',
            [userId]
          );
        }

        if (role === 'seller') {
          await pool.execute(
            'INSERT INTO sellers (user_id) VALUES (?)',
            [userId]
          );
        }
      }

      res.status(201).json({
        message: '회원가입이 완료되었습니다.',
        user_id: userId
      });
    } catch (error) {
      console.error('회원가입 실패:', error);
      console.error('에러 상세:', error.message);
      console.error('에러 스택:', error.stack);
      
      // 데이터베이스 에러 처리
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: '이미 사용 중인 아이디 또는 이메일입니다.' });
      }
      
      res.status(500).json({ 
        error: error.message || '회원가입에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// 로그인
router.post(
  '/login',
  [
    body('username').notEmpty().withMessage('아이디는 필수입니다.'),
    body('password').notEmpty().withMessage('비밀번호는 필수입니다.')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // 사용자 조회
      const [users] = await pool.execute(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      const user = users[0];

      // 비밀번호 확인
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // JWT 토큰 생성
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('로그인 실패:', error);
      res.status(500).json({ error: '로그인에 실패했습니다.' });
    }
  }
);

module.exports = router;


