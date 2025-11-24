import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 결제 승인 API
// 토스페이먼츠에서 결제 승인 후 호출되는 콜백 API

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
    const { orderId, paymentKey, amount } = body;

    if (!orderId || !paymentKey || !amount) {
      return new Response(
        JSON.stringify({ error: '주문 ID, 결제 키, 결제 금액이 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 주문 정보 조회
    const order = await env.DB.prepare(
      'SELECT id, user_id, content_id, order_number, total_amount, discount_amount, final_amount, status FROM orders WHERE id = ?'
    )
      .bind(orderId)
      .first<{ id: number; user_id: number; content_id: number; order_number: string; total_amount: number; discount_amount: number; final_amount: number; status: string }>();

    if (!order) {
      console.error(`주문을 찾을 수 없음: orderId=${orderId}`);
      return new Response(
        JSON.stringify({ error: '주문을 찾을 수 없습니다.', details: `주문 ID: ${orderId}` }),
        { status: 404, headers: corsHeaders }
      );
    }
    
    console.log(`결제 승인 요청: orderId=${orderId}, order.final_amount=${order.final_amount}, request.amount=${amount}`);

    // 주문 소유자 확인
    if (order.user_id !== tokenData.userId) {
      return new Response(
        JSON.stringify({ error: '주문 소유자가 아닙니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 이미 결제 완료된 주문인지 확인
    if (order.status === 'paid') {
      return new Response(
        JSON.stringify({ error: '이미 결제 완료된 주문입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 결제 금액 확인 (소수점 오차 허용)
    const amountDiff = Math.abs(order.final_amount - amount);
    if (amountDiff > 0.01) {
      console.warn(`결제 금액 불일치: 주문 금액=${order.final_amount}, 요청 금액=${amount}, 차이=${amountDiff}`);
      return new Response(
        JSON.stringify({ 
          error: '결제 금액이 일치하지 않습니다.',
          details: `주문 금액: ${order.final_amount}원, 요청 금액: ${amount}원`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 토스페이먼츠 결제 승인 API 호출
    // 실제 운영 환경에서는 TOSS_SECRET_KEY를 사용하여 토스페이먼츠 API를 호출해야 합니다.
    if (env.TOSS_SECRET_KEY) {
      try {
        // Base64 인코딩된 인증 정보 생성
        const authString = btoa(`${env.TOSS_SECRET_KEY}:`);
        
        // 토스페이먼츠 결제 승인 API 호출
        const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentKey: paymentKey,
            orderId: order.order_number,
            amount: amount
          })
        });

        if (!tossResponse.ok) {
          const errorData = await tossResponse.json();
          throw new Error(errorData.message || '토스페이먼츠 결제 승인 실패');
        }

        const paymentData = await tossResponse.json();
        console.log('토스페이먼츠 결제 승인 성공:', paymentData);
      } catch (tossError: any) {
        console.error('토스페이먼츠 API 호출 오류:', tossError);
        // API 호출 실패 시 에러를 throw하여 결제 승인을 중단
        return new Response(
          JSON.stringify({
            error: '토스페이먼츠 결제 승인에 실패했습니다.',
            details: tossError.message
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } else {
      console.warn('TOSS_SECRET_KEY가 설정되지 않았습니다. 결제 승인을 시뮬레이션합니다.');
      // 개발 환경에서는 시뮬레이션으로 처리
    }

    // 결제 정보 저장 (payments 테이블이 없을 수 있으므로 try-catch로 처리)
    let paymentResult: { id: number } | null = null;
    try {
      paymentResult = await env.DB.prepare(
        `INSERT INTO payments (order_id, payment_key, amount, status, approved_at)
         VALUES (?, ?, ?, 'paid', datetime('now'))
         RETURNING id`
      )
        .bind(orderId, paymentKey, amount)
        .first<{ id: number }>();
    } catch (paymentError: any) {
      console.warn('Payments table insert failed (non-critical):', paymentError?.message);
      // payments 테이블이 없어도 주문 업데이트는 계속 진행
    }

    // 주문 상태 업데이트
    const updateResult = await env.DB.prepare(
      `UPDATE orders 
       SET status = 'paid', payment_key = ?, payment_method = 'card', paid_at = datetime('now'), updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(paymentKey, orderId)
      .run();

    if (!updateResult.success) {
      return new Response(
        JSON.stringify({ error: '주문 상태 업데이트에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 콘텐츠 구매 횟수 증가
    await env.DB.prepare(
      'UPDATE contents SET purchase_count = purchase_count + 1 WHERE id = ?'
    )
      .bind(order.content_id)
      .run();

    // 구매자 총 구매 금액 업데이트
    await env.DB.prepare(
      `UPDATE buyers 
       SET total_purchase_amount = total_purchase_amount + ?,
           recent_purchase_amount = recent_purchase_amount + ?,
           updated_at = datetime('now')
       WHERE user_id = ?`
    )
      .bind(amount, amount, tokenData.userId)
      .run();

    // 판매자 총 판매 금액 업데이트
    const content = await env.DB.prepare(
      'SELECT seller_id FROM contents WHERE id = ?'
    )
      .bind(order.content_id)
      .first<{ seller_id: number }>();

    if (content) {
      await env.DB.prepare(
        `UPDATE sellers 
         SET total_sales_amount = total_sales_amount + ?,
             recent_sales_amount = recent_sales_amount + ?,
             updated_at = datetime('now')
         WHERE user_id = ?`
      )
        .bind(amount, amount, content.seller_id)
        .run();
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        paymentId: paymentResult?.id || null,
        message: '결제가 완료되었습니다.'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Payment approve error:', error);
    return new Response(
      JSON.stringify({
        error: '결제 승인 처리 중 오류가 발생했습니다.',
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

