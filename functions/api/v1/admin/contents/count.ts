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
    // 전체 콘텐츠 개수
    const totalResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents'
    ).first<{ count: number }>();

    // 상태별 개수
    const statusCounts = await env.DB.prepare(
      `SELECT status, COUNT(*) as count 
       FROM contents 
       GROUP BY status`
    ).all();

    // 카테고리별 개수
    const categoryCounts = await env.DB.prepare(
      `SELECT category, COUNT(*) as count 
       FROM contents 
       GROUP BY category 
       ORDER BY count DESC`
    ).all();

    // 판매자별 개수
    const sellerCounts = await env.DB.prepare(
      `SELECT u.username, COUNT(*) as count 
       FROM contents c
       LEFT JOIN users u ON c.seller_id = u.id
       GROUP BY c.seller_id, u.username
       ORDER BY count DESC`
    ).all();

    return new Response(
      JSON.stringify({
        total: totalResult?.count || 0,
        byStatus: statusCounts.results || [],
        byCategory: categoryCounts.results || [],
        bySeller: sellerCounts.results || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get contents count error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 개수 조회에 실패했습니다.', 
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

