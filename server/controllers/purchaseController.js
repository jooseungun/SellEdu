const pool = require('../config/database');
const gradeService = require('../services/gradeService');
const settlementService = require('../services/settlementService');

class PurchaseController {
  // 구매 처리
  async purchaseContent(req, res) {
    try {
      const { content_id, payment_method } = req.body;

      // 구매자 정보 조회
      const [buyers] = await pool.execute(
        'SELECT * FROM buyers WHERE user_id = ?',
        [req.user.id]
      );

      if (buyers.length === 0) {
        return res.status(403).json({ error: '구매자 권한이 필요합니다.' });
      }

      const buyer = buyers[0];

      // 콘텐츠 정보 조회
      const [contents] = await pool.execute(
        'SELECT * FROM contents WHERE id = ? AND status = "approved"',
        [content_id]
      );

      if (contents.length === 0) {
        return res.status(404).json({ error: '콘텐츠를 찾을 수 없습니다.' });
      }

      const content = contents[0];

      // 판매 기간 확인
      const now = new Date();
      if (!content.is_always_on_sale) {
        if (content.sale_start_date && new Date(content.sale_start_date) > now) {
          return res.status(400).json({ error: '아직 판매 시작되지 않은 콘텐츠입니다.' });
        }
        if (content.sale_end_date && new Date(content.sale_end_date) < now) {
          return res.status(400).json({ error: '판매 기간이 종료된 콘텐츠입니다.' });
        }
      }

      // 중복 구매 확인
      const [existing] = await pool.execute(
        'SELECT id FROM purchases WHERE buyer_id = ? AND content_id = ? AND payment_status = "completed"',
        [buyer.id, content_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: '이미 구매한 콘텐츠입니다.' });
      }

      // 할인율 계산 (개별 할인 > 등급 할인)
      const individualDiscount = buyer.discount_rate || 0;
      const gradeDiscount = buyer.discount_rate || 0;
      const discountRate = Math.max(individualDiscount, gradeDiscount);

      const originalPrice = parseFloat(content.price);
      const discountAmount = originalPrice * (discountRate / 100);
      const finalPrice = originalPrice - discountAmount;

      // 구매 내역 생성
      const [purchaseResult] = await pool.execute(
        `INSERT INTO purchases 
         (buyer_id, content_id, original_price, discount_amount, final_price, discount_rate, payment_method, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')`,
        [
          buyer.id,
          content_id,
          originalPrice,
          discountAmount,
          finalPrice,
          discountRate,
          payment_method || 'card'
        ]
      );

      const purchaseId = purchaseResult.insertId;

      // 정산 생성
      await settlementService.createSettlement(
        purchaseId,
        content_id,
        content.seller_id,
        finalPrice
      );

      // 구매자 금액 업데이트 및 등급 체크
      await gradeService.updateBuyerAmounts(req.user.id, finalPrice);

      res.status(201).json({
        message: '구매가 완료되었습니다.',
        purchase_id: purchaseId,
        final_price: finalPrice
      });
    } catch (error) {
      console.error('구매 처리 실패:', error);
      res.status(500).json({ error: '구매 처리에 실패했습니다.' });
    }
  }

  // 구매 이력 조회
  async getPurchaseHistory(req, res) {
    try {
      const [buyers] = await pool.execute(
        'SELECT id FROM buyers WHERE user_id = ?',
        [req.user.id]
      );

      if (buyers.length === 0) {
        return res.status(403).json({ error: '구매자 권한이 필요합니다.' });
      }

      const buyerId = buyers[0].id;

      const [purchases] = await pool.execute(
        `SELECT 
          p.*,
          c.title as content_title,
          c.thumbnail_url,
          c.duration
        FROM purchases p
        JOIN contents c ON p.content_id = c.id
        WHERE p.buyer_id = ?
        ORDER BY p.purchased_at DESC`,
        [buyerId]
      );

      res.json(purchases);
    } catch (error) {
      console.error('구매 이력 조회 실패:', error);
      res.status(500).json({ error: '구매 이력을 불러오는데 실패했습니다.' });
    }
  }
}

module.exports = new PurchaseController();


