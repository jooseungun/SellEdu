const pool = require('../config/database');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

class ContentController {
  // 콘텐츠 목록 조회 (구매자용)
  async getContents(req, res) {
    try {
      const { page = 1, limit = 20, tag, search } = req.query;
      const offset = (page - 1) * limit;

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

      if (tag) {
        query += ` AND JSON_CONTAINS(c.tags, ?)`;
        params.push(JSON.stringify(tag));
      }

      if (search) {
        query += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ` GROUP BY c.id ORDER BY c.display_order ASC, c.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [contents] = await pool.execute(query, params);

      // 총 개수 조회
      let countQuery = `SELECT COUNT(DISTINCT c.id) as total FROM contents c WHERE c.status = 'approved'`;
      const countParams = [];

      if (tag) {
        countQuery += ` AND JSON_CONTAINS(c.tags, ?)`;
        countParams.push(JSON.stringify(tag));
      }

      if (search) {
        countQuery += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }

      const [total] = await pool.execute(countQuery, countParams);

      res.json({
        contents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0].total,
          totalPages: Math.ceil(total[0].total / limit)
        }
      });
    } catch (error) {
      console.error('콘텐츠 목록 조회 실패:', error);
      res.status(500).json({ error: '콘텐츠 목록을 불러오는데 실패했습니다.' });
    }
  }

  // 콘텐츠 상세 조회
  async getContentById(req, res) {
    try {
      const { id } = req.params;

      const [contents] = await pool.execute(
        `SELECT 
          c.*,
          s.user_id as seller_user_id,
          u.username as seller_username,
          AVG(r.rating) as avg_rating,
          COUNT(r.id) as review_count
        FROM contents c
        JOIN sellers s ON c.seller_id = s.id
        JOIN users u ON s.user_id = u.id
        LEFT JOIN reviews r ON c.id = r.content_id
        WHERE c.id = ? AND c.status = 'approved'
        GROUP BY c.id`,
        [id]
      );

      if (contents.length === 0) {
        return res.status(404).json({ error: '콘텐츠를 찾을 수 없습니다.' });
      }

      const content = contents[0];

      // 차시 목록 조회
      const [lessons] = await pool.execute(
        'SELECT * FROM content_lessons WHERE content_id = ? ORDER BY display_order ASC',
        [id]
      );

      content.lessons = lessons;

      res.json(content);
    } catch (error) {
      console.error('콘텐츠 상세 조회 실패:', error);
      res.status(500).json({ error: '콘텐츠를 불러오는데 실패했습니다.' });
    }
  }

  // 콘텐츠 심사 신청 (판매자)
  async applyContent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, thumbnail_url, cdn_link, price, duration, tags, sale_start_date, sale_end_date, is_always_on_sale, lessons } = req.body;

      // 판매자 정보 조회
      const [sellers] = await pool.execute(
        'SELECT id FROM sellers WHERE user_id = ?',
        [req.user.id]
      );

      if (sellers.length === 0) {
        return res.status(403).json({ error: '판매자 권한이 필요합니다.' });
      }

      const sellerId = sellers[0].id;

      // 콘텐츠 해시 생성 (중복 검증용)
      const contentHash = crypto
        .createHash('sha256')
        .update(`${sellerId}-${cdn_link}-${title}`)
        .digest('hex');

      // 중복 콘텐츠 확인
      const [existing] = await pool.execute(
        'SELECT id FROM contents WHERE content_hash = ?',
        [contentHash]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: '이미 등록된 콘텐츠입니다.' });
      }

      // 콘텐츠 등록
      const [result] = await pool.execute(
        `INSERT INTO contents 
         (seller_id, title, description, thumbnail_url, cdn_link, content_hash, 
          price, duration, tags, sale_start_date, sale_end_date, is_always_on_sale, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          sellerId,
          title,
          description,
          thumbnail_url,
          cdn_link,
          contentHash,
          price,
          duration || 0,
          JSON.stringify(tags || []),
          sale_start_date || null,
          sale_end_date || null,
          is_always_on_sale || false
        ]
      );

      const contentId = result.insertId;

      // 차시 등록
      if (lessons && Array.isArray(lessons)) {
        for (const lesson of lessons) {
          await pool.execute(
            `INSERT INTO content_lessons (content_id, lesson_number, title, cdn_link, duration, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              contentId,
              lesson.lesson_number,
              lesson.title,
              lesson.cdn_link,
              lesson.duration || 0,
              lesson.display_order || 0
            ]
          );
        }
      }

      res.status(201).json({
        message: '콘텐츠 심사 신청이 완료되었습니다.',
        content_id: contentId
      });
    } catch (error) {
      console.error('콘텐츠 신청 실패:', error);
      res.status(500).json({ error: '콘텐츠 신청에 실패했습니다.' });
    }
  }

  // 판매 중인 콘텐츠 목록 (판매자)
  async getSellerContents(req, res) {
    try {
      const [sellers] = await pool.execute(
        'SELECT id FROM sellers WHERE user_id = ?',
        [req.user.id]
      );

      if (sellers.length === 0) {
        return res.status(403).json({ error: '판매자 권한이 필요합니다.' });
      }

      const sellerId = sellers[0].id;

      const [contents] = await pool.execute(
        `SELECT 
          c.*,
          COUNT(p.id) as purchase_count,
          SUM(p.final_price) as total_sales
        FROM contents c
        LEFT JOIN purchases p ON c.id = p.content_id AND p.payment_status = 'completed'
        WHERE c.seller_id = ?
        GROUP BY c.id
        ORDER BY c.created_at DESC`,
        [sellerId]
      );

      res.json(contents);
    } catch (error) {
      console.error('판매자 콘텐츠 조회 실패:', error);
      res.status(500).json({ error: '콘텐츠 목록을 불러오는데 실패했습니다.' });
    }
  }
}

module.exports = new ContentController();

