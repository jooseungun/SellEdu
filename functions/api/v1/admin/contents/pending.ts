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
        c.content_area,
        c.created_at,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC`
    ).all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get pending contents error:', error);
    return new Response(
      JSON.stringify({ error: '대기 중인 콘텐츠 조회에 실패했습니다.', details: error.message }),
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

