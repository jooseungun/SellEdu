import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 결제 요청 API
// 토스페이먼츠 결제를 위한 결제 정보를 생성하고 주문을 생성합니다.

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
    const { content_id, amount } = body;

    if (!content_id || !amount) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID와 결제 금액이 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 정보 조회
    const content = await env.DB.prepare(
      'SELECT id, title, price, seller_id FROM contents WHERE id = ? AND status = ?'
    )
      .bind(content_id, 'approved')
      .first<{ id: number; title: string; price: number; seller_id: number }>();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없거나 승인되지 않은 콘텐츠입니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 이미 구매한 콘텐츠인지 확인
    const existingOrder = await env.DB.prepare(
      'SELECT id FROM orders WHERE user_id = ? AND content_id = ? AND status = ?'
    )
      .bind(tokenData.userId, content_id, 'paid')
      .first<{ id: number }>();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ error: '이미 구매한 콘텐츠입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 주문 번호 생성 (YYYYMMDDHHMMSS + 랜덤 6자리)
    const now = new Date();
    const orderNumber = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // 할인 금액 계산 (구매자 등급에 따른 할인)
    const buyer = await env.DB.prepare(
      'SELECT discount_rate FROM buyers WHERE user_id = ?'
    )
      .bind(tokenData.userId)
      .first<{ discount_rate: number }>();

    const discountRate = buyer?.discount_rate || 0;
    const discountAmount = Math.floor(amount * discountRate / 100);
    const finalAmount = amount - discountAmount;

    // 주문 생성
    const orderResult = await env.DB.prepare(
      `INSERT INTO orders (user_id, content_id, order_number, total_amount, discount_amount, final_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       RETURNING id`
    )
      .bind(tokenData.userId, content_id, orderNumber, amount, discountAmount, finalAmount)
      .first<{ id: number }>();

    if (!orderResult) {
      return new Response(
        JSON.stringify({ error: '주문 생성에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const orderId = orderResult.id;

    // 결제 정보 반환 (토스페이먼츠 결제 위젯에서 사용)
    return new Response(
      JSON.stringify({
        orderId,
        orderNumber,
        amount: finalAmount,
        orderName: content.title,
        customerName: tokenData.name,
        customerEmail: tokenData.username, // username이 email 형식이라고 가정
        successUrl: `${new URL(request.url).origin}/payment/success`,
        failUrl: `${new URL(request.url).origin}/payment/fail`
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Payment request error:', error);
    return new Response(
      JSON.stringify({
        error: '결제 요청 처리 중 오류가 발생했습니다.',
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

