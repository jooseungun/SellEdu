import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 일괄 결제 요청 API (장바구니에서 여러 상품을 한 번에 결제)

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
    const { items, total_amount } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: '결제할 상품이 없습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!total_amount || total_amount <= 0) {
      return new Response(
        JSON.stringify({ error: '결제 금액이 올바르지 않습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 각 콘텐츠 정보 조회 및 검증
    const contents = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const content = await env.DB.prepare(
        'SELECT id, title, price, status FROM contents WHERE id = ? AND status = ?'
      )
        .bind(item.content_id, 'approved')
        .first<{ id: number; title: string; price: number; status: string }>();

      if (!content) {
        return new Response(
          JSON.stringify({ error: `콘텐츠 ID ${item.content_id}를 찾을 수 없거나 승인되지 않았습니다.` }),
          { status: 404, headers: corsHeaders }
        );
      }

      // 이미 구매한 콘텐츠인지 확인
      const existingOrder = await env.DB.prepare(
        'SELECT id FROM orders WHERE user_id = ? AND content_id = ? AND status = ?'
      )
        .bind(tokenData.userId, item.content_id, 'paid')
        .first<{ id: number }>();

      if (existingOrder) {
        return new Response(
          JSON.stringify({ error: `콘텐츠 "${content.title}"은(는) 이미 구매한 콘텐츠입니다.` }),
          { status: 400, headers: corsHeaders }
        );
      }

      contents.push({ ...content, quantity: item.quantity || 1 });
      calculatedTotal += content.price * (item.quantity || 1);
    }

    // 총 금액 검증
    if (Math.abs(calculatedTotal - total_amount) > 0.01) {
      return new Response(
        JSON.stringify({ error: '결제 금액이 일치하지 않습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 할인 금액 계산 (구매자 등급에 따른 할인)
    const buyer = await env.DB.prepare(
      'SELECT discount_rate FROM buyers WHERE user_id = ?'
    )
      .bind(tokenData.userId)
      .first<{ discount_rate: number }>();

    const discountRate = buyer?.discount_rate || 0;
    const discountAmount = Math.floor(total_amount * discountRate / 100);
    const finalAmount = total_amount - discountAmount;

    // 주문 번호 생성
    const now = new Date();
    const orderNumber = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // 주문 생성 (여러 상품을 하나의 주문으로 묶음)
    // 실제로는 각 상품마다 개별 주문을 생성하거나, 주문-주문상품 구조를 사용할 수 있지만
    // 여기서는 간단하게 첫 번째 상품을 기준으로 주문을 생성합니다.
    const firstContent = contents[0];
    const orderResult = await env.DB.prepare(
      `INSERT INTO orders (user_id, content_id, order_number, total_amount, discount_amount, final_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')
       RETURNING id`
    )
      .bind(tokenData.userId, firstContent.id, orderNumber, total_amount, discountAmount, finalAmount)
      .first<{ id: number }>();

    if (!orderResult) {
      return new Response(
        JSON.stringify({ error: '주문 생성에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const orderId = orderResult.id;

    // 주문명 생성
    const orderName = contents.length === 1
      ? contents[0].title
      : `${contents[0].title} 외 ${contents.length - 1}개`;

    // 결제 정보 반환
    return new Response(
      JSON.stringify({
        orderId,
        orderNumber,
        amount: finalAmount,
        orderName,
        customerName: tokenData.name,
        customerEmail: tokenData.username,
        successUrl: `${new URL(request.url).origin}/payment/success`,
        failUrl: `${new URL(request.url).origin}/payment/fail`,
        items: contents.map(c => ({
          contentId: c.id,
          title: c.title,
          quantity: c.quantity,
          price: c.price
        }))
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Batch payment request error:', error);
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

