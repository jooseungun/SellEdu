const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool = require('../config/database');
const settlementService = require('../services/settlementService');

// 모든 라우트에 관리자 권한 체크
router.use(authenticate);
router.use(authorize('admin'));

// 콘텐츠 승인
router.post('/contents/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { display_order } = req.body;

    await pool.execute(
      `UPDATE contents 
       SET status = 'approved', approved_at = NOW(), display_order = ?
       WHERE id = ?`,
      [display_order || 0, id]
    );

    res.json({ message: '콘텐츠가 승인되었습니다.' });
  } catch (error) {
    console.error('콘텐츠 승인 실패:', error);
    res.status(500).json({ error: '콘텐츠 승인에 실패했습니다.' });
  }
});

// 콘텐츠 거부
router.post('/contents/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await pool.execute(
      `UPDATE contents SET status = 'rejected' WHERE id = ?`,
      [id]
    );

    // 알림 발송 (추후 구현)
    res.json({ message: '콘텐츠가 거부되었습니다.' });
  } catch (error) {
    console.error('콘텐츠 거부 실패:', error);
    res.status(500).json({ error: '콘텐츠 거부에 실패했습니다.' });
  }
});

// 정산 완료 처리
router.post('/settlements/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    await settlementService.completeSettlement(id);
    res.json({ message: '정산이 완료되었습니다.' });
  } catch (error) {
    console.error('정산 완료 처리 실패:', error);
    res.status(500).json({ error: error.message || '정산 완료 처리에 실패했습니다.' });
  }
});

// 등급 정책 관리
router.get('/grade-policies', async (req, res) => {
  try {
    const { user_type } = req.query;
    let query = 'SELECT * FROM grade_policies WHERE 1=1';
    const params = [];

    if (user_type) {
      query += ' AND user_type = ?';
      params.push(user_type);
    }

    query += ' ORDER BY min_amount ASC';

    const [policies] = await pool.execute(query, params);
    res.json(policies);
  } catch (error) {
    console.error('등급 정책 조회 실패:', error);
    res.status(500).json({ error: '등급 정책을 불러오는데 실패했습니다.' });
  }
});

router.post('/grade-policies', async (req, res) => {
  try {
    const { user_type, grade_name, min_amount, max_amount, discount_rate, commission_rate, period_type, period_months } = req.body;

    await pool.execute(
      `INSERT INTO grade_policies 
       (user_type, grade_name, min_amount, max_amount, discount_rate, commission_rate, period_type, period_months)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_type, grade_name, min_amount, max_amount || null, discount_rate || 0, commission_rate || 10, period_type || 'recent', period_months || 3]
    );

    res.status(201).json({ message: '등급 정책이 생성되었습니다.' });
  } catch (error) {
    console.error('등급 정책 생성 실패:', error);
    res.status(500).json({ error: '등급 정책 생성에 실패했습니다.' });
  }
});

module.exports = router;

