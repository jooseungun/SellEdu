const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');

// 리뷰 작성
router.post(
  '/',
  authenticate,
  [
    body('content_id').notEmpty().withMessage('콘텐츠 ID는 필수입니다.'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('평점은 1~5 사이여야 합니다.')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content_id, rating, comment } = req.body;

      // 구매자 정보 조회
      const [buyers] = await pool.execute(
        'SELECT id FROM buyers WHERE user_id = ?',
        [req.user.id]
      );

      if (buyers.length === 0) {
        return res.status(403).json({ error: '구매자 권한이 필요합니다.' });
      }

      const buyerId = buyers[0].id;

      // 구매 확인
      const [purchases] = await pool.execute(
        'SELECT id FROM purchases WHERE buyer_id = ? AND content_id = ? AND payment_status = "completed"',
        [buyerId, content_id]
      );

      if (purchases.length === 0) {
        return res.status(403).json({ error: '구매한 콘텐츠만 리뷰를 작성할 수 있습니다.' });
      }

      const purchaseId = purchases[0].id;

      // 중복 리뷰 확인
      const [existing] = await pool.execute(
        'SELECT id FROM reviews WHERE buyer_id = ? AND content_id = ?',
        [buyerId, content_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: '이미 리뷰를 작성한 콘텐츠입니다.' });
      }

      // 리뷰 작성
      await pool.execute(
        `INSERT INTO reviews (buyer_id, content_id, purchase_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [buyerId, content_id, purchaseId, rating, comment || null]
      );

      res.status(201).json({ message: '리뷰가 작성되었습니다.' });
    } catch (error) {
      console.error('리뷰 작성 실패:', error);
      res.status(500).json({ error: '리뷰 작성에 실패했습니다.' });
    }
  }
);

// 리뷰 목록 조회
router.get('/', async (req, res) => {
  try {
    const { content_id } = req.query;

    let query = `
      SELECT 
        r.*,
        b.user_id as buyer_user_id,
        u.username as buyer_username
      FROM reviews r
      JOIN buyers b ON r.buyer_id = b.id
      JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    if (content_id) {
      query += ` AND r.content_id = ?`;
      params.push(content_id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const [reviews] = await pool.execute(query, params);
    res.json(reviews);
  } catch (error) {
    console.error('리뷰 조회 실패:', error);
    res.status(500).json({ error: '리뷰 목록을 불러오는데 실패했습니다.' });
  }
});

module.exports = router;

