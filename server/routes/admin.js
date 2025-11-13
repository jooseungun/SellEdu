const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool = require('../config/database');
const settlementService = require('../services/settlementService');
const adminController = require('../controllers/adminController');

// 모든 라우트에 관리자 권한 체크
router.use(authenticate);
router.use(authorize('admin'));

// 심사 대기 목록 조회 (재심사 포함)
router.get('/contents/pending', adminController.getPendingContents.bind(adminController));

// 콘텐츠 승인
router.post('/contents/:id/approve', adminController.approveContent.bind(adminController));

// 콘텐츠 거부 (미승인 사유 포함)
router.post('/contents/:id/reject', adminController.rejectContent.bind(adminController));

// 판매중인 콘텐츠 목록 조회
router.get('/contents/approved', adminController.getApprovedContents.bind(adminController));

// 콘텐츠 정렬순서 변경
router.put('/contents/order', adminController.updateContentOrder.bind(adminController));

// 콘텐츠 판매 중지
router.post('/contents/:id/suspend', adminController.suspendContent.bind(adminController));

// 콘텐츠 후기 관리
router.get('/reviews', adminController.getContentReviews.bind(adminController));

// 후기 삭제
router.delete('/reviews/:id', adminController.deleteReview.bind(adminController));

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


