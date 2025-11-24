// 구매 내역 조회 API

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestGet({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 구매 내역 조회 (결제 완료된 주문만)
    const purchases = await env.DB.prepare(`
      SELECT 
        o.id,
        o.order_number,
        o.content_id,
        o.final_amount,
        o.status,
        o.paid_at,
        o.created_at,
        c.title,
        c.thumbnail_url,
        c.price,
        c.education_period,
        c.category,
        c.grade
      FROM orders o
      INNER JOIN contents c ON o.content_id = c.id
      WHERE o.user_id = ? AND o.status = 'paid'
      ORDER BY o.paid_at DESC
    `)
      .bind(tokenData.userId)
      .all<{
        id: number;
        order_number: string;
        content_id: number;
        final_amount: number;
        status: string;
        paid_at: string;
        created_at: string;
        title: string;
        thumbnail_url: string | null;
        price: number;
        education_period: number;
        category: string;
        grade: string;
      }>();

    // 남은 이용기간 계산
    const purchasesWithRemainingDays = purchases.results?.map(purchase => {
      const paidDate = new Date(purchase.paid_at);
      const educationPeriodDays = purchase.education_period || 0;
      const expiryDate = new Date(paidDate);
      expiryDate.setDate(expiryDate.getDate() + educationPeriodDays);
      
      const now = new Date();
      const remainingDays = Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const isExpired = remainingDays === 0;
      
      return {
        ...purchase,
        paid_date: purchase.paid_at,
        expiry_date: expiryDate.toISOString(),
        remaining_days: remainingDays,
        is_expired: isExpired
      };
    }) || [];

    return new Response(
      JSON.stringify({
        purchases: purchasesWithRemainingDays,
        total_count: purchasesWithRemainingDays.length
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Purchases get error:', error);
    return new Response(
      JSON.stringify({
        error: '구매 내역 조회에 실패했습니다.',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

