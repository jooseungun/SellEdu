const pool = require('../config/database');

class AdminController {
  // 심사 대기 목록 조회 (재심사 포함)
  async getPendingContents(req, res) {
    try {
      const [contents] = await pool.execute(
        `SELECT 
          c.*,
          s.user_id as seller_user_id,
          u.username as seller_username,
          u.name as seller_name
        FROM contents c
        JOIN sellers s ON c.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        WHERE c.status = 'pending'
        ORDER BY c.is_reapply DESC, c.created_at ASC`
      );

      res.json(contents);
    } catch (error) {
      console.error('심사 대기 목록 조회 실패:', error);
      res.status(500).json({ error: '심사 대기 목록을 불러오는데 실패했습니다.' });
    }
  }

  // 콘텐츠 승인
  async approveContent(req, res) {
    try {
      const { id } = req.params;
      const { display_order, content_area } = req.body;

      await pool.execute(
        `UPDATE contents 
         SET status = 'approved', 
             approved_at = NOW(), 
             display_order = ?,
             content_area = ?,
             is_reapply = FALSE,
             rejection_reason = NULL
         WHERE id = ?`,
        [display_order || 0, content_area || 'default', id]
      );

      res.json({ message: '콘텐츠가 승인되었습니다.' });
    } catch (error) {
      console.error('콘텐츠 승인 실패:', error);
      res.status(500).json({ error: '콘텐츠 승인에 실패했습니다.' });
    }
  }

  // 콘텐츠 거부 (미승인 사유 포함)
  async rejectContent(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: '미승인 사유를 입력해주세요.' });
      }

      await pool.execute(
        `UPDATE contents 
         SET status = 'rejected', 
             rejection_reason = ?,
             rejected_at = NOW(),
             is_reapply = FALSE
         WHERE id = ?`,
        [reason, id]
      );

      // 판매자에게 알림 발송 (추후 구현)
      res.json({ message: '콘텐츠가 거부되었습니다.' });
    } catch (error) {
      console.error('콘텐츠 거부 실패:', error);
      res.status(500).json({ error: '콘텐츠 거부에 실패했습니다.' });
    }
  }

  // 판매중인 콘텐츠 목록 조회
  async getApprovedContents(req, res) {
    try {
      const { area } = req.query;
      
      let query = `
        SELECT 
          c.*,
          s.user_id as seller_user_id,
          u.username as seller_username,
          AVG(r.rating) as avg_rating,
          COUNT(r.id) as review_count
        FROM contents c
        JOIN sellers s ON c.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN reviews r ON c.id = r.content_id
        WHERE c.status = 'approved'
      `;

      const params = [];
      if (area) {
        query += ` AND c.content_area = ?`;
        params.push(area);
      }

      query += ` GROUP BY c.id ORDER BY c.content_area ASC, c.display_order ASC, c.created_at DESC`;

      const [contents] = await pool.execute(query, params);
      res.json(contents);
    } catch (error) {
      console.error('판매중 콘텐츠 조회 실패:', error);
      res.status(500).json({ error: '콘텐츠 목록을 불러오는데 실패했습니다.' });
    }
  }

  // 콘텐츠 정렬순서 변경
  async updateContentOrder(req, res) {
    try {
      const { content_id, display_order, content_area } = req.body;

      await pool.execute(
        `UPDATE contents 
         SET display_order = ?, content_area = ?
         WHERE id = ?`,
        [display_order, content_area || 'default', content_id]
      );

      res.json({ message: '정렬순서가 변경되었습니다.' });
    } catch (error) {
      console.error('정렬순서 변경 실패:', error);
      res.status(500).json({ error: '정렬순서 변경에 실패했습니다.' });
    }
  }

  // 콘텐츠 판매 중지
  async suspendContent(req, res) {
    try {
      const { id } = req.params;

      await pool.execute(
        `UPDATE contents SET status = 'suspended' WHERE id = ?`,
        [id]
      );

      res.json({ message: '콘텐츠 판매가 중지되었습니다.' });
    } catch (error) {
      console.error('콘텐츠 중지 실패:', error);
      res.status(500).json({ error: '콘텐츠 중지에 실패했습니다.' });
    }
  }

  // 콘텐츠 후기 관리
  async getContentReviews(req, res) {
    try {
      const { content_id } = req.query;

      let query = `
        SELECT 
          r.*,
          b.user_id as buyer_user_id,
          u.username as buyer_username,
          u.name as buyer_name,
          c.title as content_title
        FROM reviews r
        JOIN buyers b ON r.buyer_id = b.id
        JOIN users u ON b.user_id = u.id
        JOIN contents c ON r.content_id = c.id
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
      console.error('후기 조회 실패:', error);
      res.status(500).json({ error: '후기 목록을 불러오는데 실패했습니다.' });
    }
  }

  // 후기 삭제
  async deleteReview(req, res) {
    try {
      const { id } = req.params;

      await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);

      res.json({ message: '후기가 삭제되었습니다.' });
    } catch (error) {
      console.error('후기 삭제 실패:', error);
      res.status(500).json({ error: '후기 삭제에 실패했습니다.' });
    }
  }
}

module.exports = new AdminController();

