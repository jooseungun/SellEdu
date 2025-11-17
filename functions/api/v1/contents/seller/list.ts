import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../utils/token';

export async function onRequestGet({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    // 공통 토큰 디코딩 함수 사용
    const tokenData = getTokenFromRequest(request);
    
    if (!tokenData) {
      console.log('Seller list - Token decode failed or missing');
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다. 다시 로그인해주세요.' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const sellerId = tokenData.userId;
    console.log('Seller list - Authenticated user:', { userId: sellerId, username: tokenData.username, role: tokenData.role });
    
    if (!sellerId) {
      console.error('Seller list - userId not found in token');
      return new Response(
        JSON.stringify({ error: '사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const result = await env.DB.prepare(
      `SELECT
        c.id,
        c.seller_id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.price,
        c.category,
        c.grade,
        c.age_rating,
        c.status,
        c.display_order,
        c.purchase_count,
        c.avg_rating,
        c.review_count,
        c.duration,
        c.rejection_reason,
        c.is_reapply,
        c.created_at,
        c.updated_at,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.seller_id = ?
      ORDER BY c.created_at DESC`
    )
      .bind(sellerId)
      .all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get seller contents error:', error);
    return new Response(
      JSON.stringify({ error: '판매자 콘텐츠 조회에 실패했습니다.', details: error.message }),
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

