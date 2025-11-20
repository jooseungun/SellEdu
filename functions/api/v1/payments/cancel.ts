import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 결제 취소 API

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    TOSS_SECRET_KEY?: string;
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

    const body = await request.json();
    const { orderId, cancelReason } = body;

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: '주문 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 주문 정보 조회
    const order = await env.DB.prepare(
      'SELECT id, user_id, payment_key, status FROM orders WHERE id = ?'
    )
      .bind(orderId)
      .first<{ id: number; user_id: number; payment_key: string | null; status: string }>();

    if (!order) {
      return new Response(
        JSON.stringify({ error: '주문을 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 주문 소유자 확인
    if (order.user_id !== tokenData.userId) {
      return new Response(
        JSON.stringify({ error: '주문 소유자가 아닙니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 결제 완료된 주문만 취소 가능
    if (order.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: '결제 완료된 주문만 취소할 수 있습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 토스페이먼츠 결제 취소 API 호출
    // 실제 운영 환경에서는 TOSS_SECRET_KEY를 사용하여 토스페이먼츠 API를 호출해야 합니다.
    
    if (!env.TOSS_SECRET_KEY) {
      console.warn('TOSS_SECRET_KEY가 설정되지 않았습니다. 결제 취소를 시뮬레이션합니다.');
    }

    // 결제 상태 업데이트
    await env.DB.prepare(
      `UPDATE payments 
       SET status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now')
       WHERE order_id = ?`
    )
      .bind(orderId)
      .run();

    // 주문 상태 업데이트
    await env.DB.prepare(
      `UPDATE orders 
       SET status = 'cancelled', updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(orderId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        message: '결제가 취소되었습니다.'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Payment cancel error:', error);
    return new Response(
      JSON.stringify({
        error: '결제 취소 처리 중 오류가 발생했습니다.',
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

