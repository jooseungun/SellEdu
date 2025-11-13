const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const purchaseController = require('../controllers/purchaseController');

// 구매 처리
router.post(
  '/',
  authenticate,
  purchaseController.purchaseContent.bind(purchaseController)
);

// 구매 이력 조회
router.get(
  '/history',
  authenticate,
  purchaseController.getPurchaseHistory.bind(purchaseController)
);

module.exports = router;


