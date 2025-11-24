// 관리자 판매 내역 조회 API

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

    // 관리자 권한 확인
    const user = await env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    )
      .bind(tokenData.userId)
      .first<{ role: string }>();

    if (!user || user.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 전체 판매 내역 조회
    const sales = await env.DB.prepare(`
      SELECT 
        o.id,
        o.order_number,
        o.content_id,
        o.user_id as buyer_id,
        o.final_amount,
        o.status,
        o.paid_at,
        o.created_at,
        c.title,
        c.thumbnail_url,
        c.price,
        c.category,
        c.grade,
        c.seller_id,
        u.name as buyer_name,
        u.email as buyer_email,
        seller.name as seller_name,
        seller.email as seller_email
      FROM orders o
      INNER JOIN contents c ON o.content_id = c.id
      INNER JOIN users u ON o.user_id = u.id
      INNER JOIN users seller ON c.seller_id = seller.id
      WHERE o.status = 'paid'
      ORDER BY o.paid_at DESC
    `)
      .all<{
        id: number;
        order_number: string;
        content_id: number;
        buyer_id: number;
        final_amount: number;
        status: string;
        paid_at: string;
        created_at: string;
        title: string;
        thumbnail_url: string | null;
        price: number;
        category: string;
        grade: string;
        seller_id: number;
        buyer_name: string;
        buyer_email: string;
        seller_name: string;
        seller_email: string;
      }>();

    // 총 판매 금액 계산
    const totalSales = sales.results?.reduce((sum, sale) => sum + sale.final_amount, 0) || 0;

    // 판매자별 집계
    const sellerStats = new Map<number, { name: string; email: string; count: number; amount: number }>();
    sales.results?.forEach(sale => {
      const existing = sellerStats.get(sale.seller_id) || { name: sale.seller_name, email: sale.seller_email, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += sale.final_amount;
      sellerStats.set(sale.seller_id, existing);
    });

    return new Response(
      JSON.stringify({
        sales: sales.results || [],
        total_count: sales.results?.length || 0,
        total_amount: totalSales,
        seller_stats: Array.from(sellerStats.values())
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Admin sales get error:', error);
    return new Response(
      JSON.stringify({
        error: '판매 내역 조회에 실패했습니다.',
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

