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
    // Authorization 헤더에서 토큰 읽기
    const authHeader = request.headers.get('Authorization');
    let sellerId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const tokenData = JSON.parse(atob(token));
        sellerId = tokenData.userId || null;
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }
    
    // 토큰이 없거나 sellerId가 없으면 joosu 계정의 콘텐츠 반환 (프로토타입)
    if (!sellerId) {
      const joosuUser = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      )
        .bind('joosu')
        .first<{ id: number }>();
      
      if (joosuUser) {
        sellerId = joosuUser.id;
      }
    }
    
    if (!sellerId) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: corsHeaders }
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

