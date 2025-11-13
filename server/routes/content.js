const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const contentController = require('../controllers/contentController');
const { body } = require('express-validator');

// 구매자용: 콘텐츠 목록 조회 (인증 불필요)
router.get('/', contentController.getContents.bind(contentController));

// 구매자용: 콘텐츠 상세 조회 (인증 불필요)
router.get('/:id', contentController.getContentById.bind(contentController));

// 판매자용: 콘텐츠 심사 신청
router.post(
  '/apply',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다.'),
    body('cdn_link').notEmpty().withMessage('CDN 링크는 필수입니다.'),
    body('price').isFloat({ min: 0 }).withMessage('가격은 0 이상이어야 합니다.')
  ],
  contentController.applyContent.bind(contentController)
);

// 판매자용: 판매 중인 콘텐츠 목록
router.get(
  '/seller/list',
  authenticate,
  contentController.getSellerContents.bind(contentController)
);

// 판매자용: 콘텐츠 수정 및 재심사 신청
router.put(
  '/:id',
  authenticate,
  [
    body('title').notEmpty().withMessage('제목은 필수입니다.'),
    body('cdn_link').notEmpty().withMessage('CDN 링크는 필수입니다.'),
    body('price').isFloat({ min: 0 }).withMessage('가격은 0 이상이어야 합니다.')
  ],
  contentController.updateContent.bind(contentController)
);

module.exports = router;


