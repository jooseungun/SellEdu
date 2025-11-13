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
        r.id,
        r.content_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        u.username,
        u.name as user_name,
        c.title as content_title
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN contents c ON r.content_id = c.id
      ORDER BY r.created_at DESC`
    ).all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get reviews error:', error);
    // reviews 테이블이 없을 수 있으므로 빈 배열 반환
    return new Response(
      JSON.stringify([]),
      { status: 200, headers: corsHeaders }
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

