const pool = require('../config/database');
const crypto = require('crypto');

class GradeService {
  // 등급 정책 조회
  async getGradePolicies(userType) {
    const [policies] = await pool.execute(
      `SELECT * FROM grade_policies 
       WHERE user_type = ? AND is_active = TRUE 
       ORDER BY min_amount ASC`,
      [userType]
    );
    return policies;
  }

  // 구매자 등급 자동 업데이트
  async updateBuyerGrade(userId) {
    try {
      // 구매자 정보 조회
      const [buyers] = await pool.execute(
        'SELECT * FROM buyers WHERE user_id = ?',
        [userId]
      );

      if (buyers.length === 0) return null;

      const buyer = buyers[0];
      
      // 등급 정책 조회
      const policies = await this.getGradePolicies('buyer');
      
      // 현재 기준 금액 계산 (최근 X개월 또는 총 누적)
      const baseAmount = buyer.recent_months > 0 
        ? buyer.recent_purchase_amount 
        : buyer.total_purchase_amount;

      // 적합한 등급 찾기
      let newGrade = 'BRONZE';
      let newDiscountRate = 0.00;

      for (const policy of policies) {
        if (baseAmount >= policy.min_amount && 
            (!policy.max_amount || baseAmount < policy.max_amount)) {
          newGrade = policy.grade_name;
          newDiscountRate = policy.discount_rate;
          break;
        }
      }

      // 등급 변경 확인
      if (buyer.grade !== newGrade) {
        const oldGrade = buyer.grade;
        
        // 등급 이력 기록
        await pool.execute(
          `INSERT INTO grade_history (user_id, user_type, old_grade, new_grade, reason, amount)
           VALUES (?, 'buyer', ?, ?, ?, ?)`,
          [
            userId,
            oldGrade,
            newGrade,
            `자동 등급 업데이트: ${baseAmount.toLocaleString()}원 기준`,
            baseAmount
          ]
        );

        // 구매자 등급 업데이트
        await pool.execute(
          `UPDATE buyers 
           SET grade = ?, discount_rate = ?, last_grade_update = NOW()
           WHERE user_id = ?`,
          [newGrade, newDiscountRate, userId]
        );

        return { oldGrade, newGrade, discountRate: newDiscountRate };
      }

      return null;
    } catch (error) {
      console.error('구매자 등급 업데이트 실패:', error);
      throw error;
    }
  }

  // 판매자 등급 자동 업데이트
  async updateSellerGrade(userId) {
    try {
      // 판매자 정보 조회
      const [sellers] = await pool.execute(
        'SELECT * FROM sellers WHERE user_id = ?',
        [userId]
      );

      if (sellers.length === 0) return null;

      const seller = sellers[0];
      
      // 등급 정책 조회
      const policies = await this.getGradePolicies('seller');
      
      // 현재 기준 금액 계산
      const baseAmount = seller.recent_months > 0 
        ? seller.recent_sales_amount 
        : seller.total_sales_amount;

      // 적합한 등급 찾기
      let newGrade = 'BRONZE';
      let newCommissionRate = 10.00;

      for (const policy of policies) {
        if (baseAmount >= policy.min_amount && 
            (!policy.max_amount || baseAmount < policy.max_amount)) {
          newGrade = policy.grade_name;
          newCommissionRate = policy.commission_rate;
          break;
        }
      }

      // 등급 변경 확인
      if (seller.grade !== newGrade) {
        const oldGrade = seller.grade;
        
        // 등급 이력 기록
        await pool.execute(
          `INSERT INTO grade_history (user_id, user_type, old_grade, new_grade, reason, amount)
           VALUES (?, 'seller', ?, ?, ?, ?)`,
          [
            userId,
            oldGrade,
            newGrade,
            `자동 등급 업데이트: ${baseAmount.toLocaleString()}원 기준`,
            baseAmount
          ]
        );

        // 판매자 등급 및 수수료율 업데이트
        await pool.execute(
          `UPDATE sellers 
           SET grade = ?, commission_rate = ?, last_grade_update = NOW()
           WHERE user_id = ?`,
          [newGrade, newCommissionRate, userId]
        );

        return { oldGrade, newGrade, commissionRate: newCommissionRate };
      }

      return null;
    } catch (error) {
      console.error('판매자 등급 업데이트 실패:', error);
      throw error;
    }
  }

  // 구매 후 구매자 금액 업데이트
  async updateBuyerAmounts(userId, purchaseAmount) {
    try {
      const [buyers] = await pool.execute(
        'SELECT * FROM buyers WHERE user_id = ?',
        [userId]
      );

      if (buyers.length === 0) return;

      const buyer = buyers[0];
      const recentMonths = buyer.recent_months || 3;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - recentMonths);

      // 최근 X개월 구매 금액 재계산
      const [recentPurchases] = await pool.execute(
        `SELECT COALESCE(SUM(final_price), 0) as total
         FROM purchases 
         WHERE buyer_id = ? AND purchased_at >= ? AND payment_status = 'completed'`,
        [buyer.id, cutoffDate]
      );

      const recentAmount = parseFloat(recentPurchases[0].total || 0);
      const totalAmount = buyer.total_purchase_amount + purchaseAmount;

      // 구매자 정보 업데이트
      await pool.execute(
        `UPDATE buyers 
         SET total_purchase_amount = ?, recent_purchase_amount = ?
         WHERE user_id = ?`,
        [totalAmount, recentAmount, userId]
      );

      // 등급 자동 업데이트
      await this.updateBuyerGrade(userId);
    } catch (error) {
      console.error('구매자 금액 업데이트 실패:', error);
      throw error;
    }
  }

  // 판매 후 판매자 금액 업데이트
  async updateSellerAmounts(sellerId, salesAmount) {
    try {
      const [sellers] = await pool.execute(
        'SELECT * FROM sellers WHERE id = ?',
        [sellerId]
      );

      if (sellers.length === 0) return;

      const seller = sellers[0];
      const recentMonths = seller.recent_months || 3;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - recentMonths);

      // 최근 X개월 판매 금액 재계산
      const [recentSales] = await pool.execute(
        `SELECT COALESCE(SUM(total_amount), 0) as total
         FROM settlements 
         WHERE seller_id = ? AND created_at >= ? AND settlement_status = 'completed'`,
        [sellerId, cutoffDate]
      );

      const recentAmount = parseFloat(recentSales[0].total || 0);
      const totalAmount = seller.total_sales_amount + salesAmount;

      // 판매자 정보 업데이트
      await pool.execute(
        `UPDATE sellers 
         SET total_sales_amount = ?, recent_sales_amount = ?
         WHERE id = ?`,
        [totalAmount, recentAmount, sellerId]
      );

      // 등급 자동 업데이트
      await this.updateSellerGrade(seller.user_id);
    } catch (error) {
      console.error('판매자 금액 업데이트 실패:', error);
      throw error;
    }
  }
}

module.exports = new GradeService();

