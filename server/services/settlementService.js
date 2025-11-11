const pool = require('../config/database');
const gradeService = require('./gradeService');

class SettlementService {
  // 정산 생성 (구매 완료 시)
  async createSettlement(purchaseId, contentId, sellerId, totalAmount) {
    try {
      // 판매자 정보 조회 (개별 수수료율 우선)
      const [sellers] = await pool.execute(
        'SELECT * FROM sellers WHERE id = ?',
        [sellerId]
      );

      if (sellers.length === 0) {
        throw new Error('판매자를 찾을 수 없습니다.');
      }

      const seller = sellers[0];
      
      // 수수료율 결정 (개별 설정 > 등급별 설정)
      const commissionRate = seller.commission_rate || 10.00;
      const commissionAmount = totalAmount * (commissionRate / 100);
      const sellerAmount = totalAmount - commissionAmount;

      // 정산 내역 생성
      const [result] = await pool.execute(
        `INSERT INTO settlements 
         (seller_id, content_id, purchase_id, total_amount, commission_rate, commission_amount, seller_amount, settlement_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [sellerId, contentId, purchaseId, totalAmount, commissionRate, commissionAmount, sellerAmount]
      );

      // 판매자 금액 업데이트 및 등급 체크
      await gradeService.updateSellerAmounts(sellerId, totalAmount);

      return result.insertId;
    } catch (error) {
      console.error('정산 생성 실패:', error);
      throw error;
    }
  }

  // 정산 신청 (판매자)
  async requestSettlement(sellerId, periodStart, periodEnd) {
    try {
      // 중복 정산 방지: 해당 기간에 이미 정산 이력이 있는지 확인
      const [existing] = await pool.execute(
        `SELECT id FROM settlement_history 
         WHERE seller_id = ? 
         AND settlement_period_start = ? 
         AND settlement_period_end = ?
         AND settlement_status IN ('pending', 'processing', 'completed')`,
        [sellerId, periodStart, periodEnd]
      );

      if (existing.length > 0) {
        throw new Error('해당 기간에 대한 정산 신청이 이미 존재합니다.');
      }

      // 해당 기간의 미정산 내역 조회
      const [settlements] = await pool.execute(
        `SELECT 
           SUM(total_amount) as total_amount,
           SUM(commission_amount) as total_commission,
           SUM(seller_amount) as seller_amount,
           COUNT(*) as count
         FROM settlements
         WHERE seller_id = ?
         AND settlement_status = 'pending'
         AND DATE(created_at) BETWEEN ? AND ?`,
        [sellerId, periodStart, periodEnd]
      );

      if (settlements.length === 0 || settlements[0].count === 0) {
        throw new Error('정산할 내역이 없습니다.');
      }

      const settlement = settlements[0];

      // 정산 이력 생성
      const [result] = await pool.execute(
        `INSERT INTO settlement_history 
         (seller_id, settlement_period_start, settlement_period_end, 
          total_amount, total_commission, seller_amount, settlement_count, 
          settlement_status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
        [
          sellerId,
          periodStart,
          periodEnd,
          settlement.total_amount,
          settlement.total_commission,
          settlement.seller_amount,
          settlement.count
        ]
      );

      // 정산 내역 상태 업데이트
      await pool.execute(
        `UPDATE settlements 
         SET settlement_status = 'requested', settlement_date = ?
         WHERE seller_id = ? 
         AND settlement_status = 'pending'
         AND DATE(created_at) BETWEEN ? AND ?`,
        [periodEnd, sellerId, periodStart, periodEnd]
      );

      return result.insertId;
    } catch (error) {
      console.error('정산 신청 실패:', error);
      throw error;
    }
  }

  // 정산 완료 처리 (관리자)
  async completeSettlement(settlementHistoryId) {
    try {
      // 정산 이력 조회
      const [histories] = await pool.execute(
        'SELECT * FROM settlement_history WHERE id = ?',
        [settlementHistoryId]
      );

      if (histories.length === 0) {
        throw new Error('정산 이력을 찾을 수 없습니다.');
      }

      const history = histories[0];

      if (history.settlement_status !== 'pending' && history.settlement_status !== 'processing') {
        throw new Error('이미 처리된 정산입니다.');
      }

      // 정산 완료 처리
      await pool.execute(
        `UPDATE settlement_history 
         SET settlement_status = 'completed', completed_at = NOW()
         WHERE id = ?`,
        [settlementHistoryId]
      );

      // 관련 정산 내역 상태 업데이트
      await pool.execute(
        `UPDATE settlements 
         SET settlement_status = 'completed'
         WHERE seller_id = ?
         AND settlement_date BETWEEN ? AND ?`,
        [
          history.seller_id,
          history.settlement_period_start,
          history.settlement_period_end
        ]
      );

      return true;
    } catch (error) {
      console.error('정산 완료 처리 실패:', error);
      throw error;
    }
  }

  // 정산 내역 조회 (판매자)
  async getSettlementHistory(sellerId, limit = 50, offset = 0) {
    try {
      const [histories] = await pool.execute(
        `SELECT * FROM settlement_history 
         WHERE seller_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [sellerId, limit, offset]
      );

      const [total] = await pool.execute(
        'SELECT COUNT(*) as count FROM settlement_history WHERE seller_id = ?',
        [sellerId]
      );

      return {
        histories,
        total: total[0].count
      };
    } catch (error) {
      console.error('정산 이력 조회 실패:', error);
      throw error;
    }
  }

  // 정산 상세 내역 조회
  async getSettlementDetails(settlementHistoryId) {
    try {
      const [histories] = await pool.execute(
        'SELECT * FROM settlement_history WHERE id = ?',
        [settlementHistoryId]
      );

      if (histories.length === 0) {
        throw new Error('정산 이력을 찾을 수 없습니다.');
      }

      const history = histories[0];

      // 해당 기간의 정산 내역 조회
      const [settlements] = await pool.execute(
        `SELECT 
           s.*,
           c.title as content_title,
           c.price as content_price
         FROM settlements s
         JOIN contents c ON s.content_id = c.id
         WHERE s.seller_id = ?
         AND s.settlement_date BETWEEN ? AND ?
         ORDER BY s.created_at DESC`,
        [
          history.seller_id,
          history.settlement_period_start,
          history.settlement_period_end
        ]
      );

      return {
        history,
        settlements
      };
    } catch (error) {
      console.error('정산 상세 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = new SettlementService();

