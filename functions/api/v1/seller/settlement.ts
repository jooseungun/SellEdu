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
    // 현재는 프로토타입이므로 모든 판매자의 정산 내역을 반환
    const result = await env.DB.prepare(
      `SELECT
        s.id,
        s.seller_id,
        s.amount,
        s.commission_rate,
        s.commission_amount,
        s.settlement_amount,
        s.status,
        s.settlement_date,
        s.created_at,
        u.username as seller_username
      FROM settlements s
      LEFT JOIN users u ON s.seller_id = u.id
      WHERE u.role = 'seller'
      ORDER BY s.created_at DESC
      LIMIT 100`
    ).all();

    return new Response(
      JSON.stringify({
        histories: result.results || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get settlement error:', error);
    // settlements 테이블이 없을 수 있으므로 빈 배열 반환
    return new Response(
      JSON.stringify({
        histories: []
      }),
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

