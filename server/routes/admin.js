const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const pool = require('../config/database');
const settlementService = require('../services/settlementService');
const adminController = require('../controllers/adminController');
const initAdmin = require('../database/initAdmin');

// 관리자 계정 초기화 (개발용)
router.post('/init-admin', async (req, res) => {
  try {
    await initAdmin();
    res.json({ message: '관리자 계정이 초기화되었습니다. (admin/admin)' });
  } catch (error) {
    console.error('관리자 계정 초기화 실패:', error);
    res.status(500).json({ error: '관리자 계정 초기화에 실패했습니다.' });
  }
});

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
    await settlementService.completeSettlement(parseInt(id));
    res.json({ message: '정산이 완료되었습니다.' });
  } catch (error) {
    console.error('정산 완료 실패:', error);
    res.status(500).json({ error: '정산 완료에 실패했습니다.' });
  }
});

module.exports = router;
