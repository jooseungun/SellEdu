import { D1Database } from '@cloudflare/workers-types';

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
    // TODO: 실제로는 Authorization 헤더에서 토큰을 읽어서 판매자 ID를 확인해야 함
    // 현재는 프로토타입이므로 모든 판매자의 콘텐츠를 반환
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
        c.created_at,
        c.updated_at,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE u.role = 'seller'
      ORDER BY c.created_at DESC`
    ).all();

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

