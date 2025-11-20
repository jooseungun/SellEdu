import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 구매자 정보 조회 API (할인율 포함)

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
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 구매자 정보 조회
    const buyer = await env.DB.prepare(
      'SELECT grade, discount_rate, total_purchase_amount, recent_purchase_amount FROM buyers WHERE user_id = ?'
    )
      .bind(tokenData.userId)
      .first<{ 
        grade: string; 
        discount_rate: number; 
        total_purchase_amount: number; 
        recent_purchase_amount: number;
      }>();

    if (!buyer) {
      // 구매자 레코드가 없으면 기본값 반환
      return new Response(
        JSON.stringify({
          grade: 'BRONZE',
          discount_rate: 0,
          total_purchase_amount: 0,
          recent_purchase_amount: 0
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify(buyer),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Buyer info error:', error);
    return new Response(
      JSON.stringify({
        error: '구매자 정보 조회에 실패했습니다.',
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

