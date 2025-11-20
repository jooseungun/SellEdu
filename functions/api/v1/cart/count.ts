import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 장바구니 개수 조회 API (Header에서 사용)

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
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ count: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 장바구니 개수 조회
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?'
    )
      .bind(tokenData.userId)
      .first<{ count: number }>();

    return new Response(
      JSON.stringify({
        count: result?.count || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Cart count error:', error);
    return new Response(
      JSON.stringify({
        count: 0
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

