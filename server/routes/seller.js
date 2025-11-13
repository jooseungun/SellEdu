const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const settlementService = require('../services/settlementService');

// 정산 내역 조회
router.get(
  '/settlement',
  authenticate,
  async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      // 판매자 정보 조회
      const pool = require('../config/database');
      const [sellers] = await pool.execute(
        'SELECT id FROM sellers WHERE user_id = ?',
        [req.user.id]
      );

      if (sellers.length === 0) {
        return res.status(403).json({ error: '판매자 권한이 필요합니다.' });
      }

      const result = await settlementService.getSettlementHistory(
        sellers[0].id,
        parseInt(limit),
        parseInt(offset)
      );

      res.json(result);
    } catch (error) {
      console.error('정산 내역 조회 실패:', error);
      res.status(500).json({ error: '정산 내역을 불러오는데 실패했습니다.' });
    }
  }
);

// 정산 신청
router.post(
  '/settlement/request',
  authenticate,
  async (req, res) => {
    try {
      const { period_start, period_end } = req.body;

      if (!period_start || !period_end) {
        return res.status(400).json({ error: '정산 기간을 입력해주세요.' });
      }

      // 판매자 정보 조회
      const pool = require('../config/database');
      const [sellers] = await pool.execute(
        'SELECT id FROM sellers WHERE user_id = ?',
        [req.user.id]
      );

      if (sellers.length === 0) {
        return res.status(403).json({ error: '판매자 권한이 필요합니다.' });
      }

      const settlementId = await settlementService.requestSettlement(
        sellers[0].id,
        period_start,
        period_end
      );

      res.status(201).json({
        message: '정산 신청이 완료되었습니다.',
        settlement_id: settlementId
      });
    } catch (error) {
      console.error('정산 신청 실패:', error);
      res.status(500).json({ error: error.message || '정산 신청에 실패했습니다.' });
    }
  }
);

module.exports = router;


