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

    // 데이터베이스 테이블 확인 및 생성
    try {
      const ordersTableCheck = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'"
      ).first();

      if (!ordersTableCheck) {
        // orders 테이블 생성
        await env.DB.exec(`
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content_id INTEGER NOT NULL,
            order_number TEXT UNIQUE NOT NULL,
            total_amount REAL NOT NULL,
            discount_amount REAL DEFAULT 0.00,
            final_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled', 'refunded', 'failed')),
            payment_method TEXT,
            payment_key TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            paid_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
          CREATE INDEX IF NOT EXISTS idx_orders_content_id ON orders(content_id);
          CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        `);

        // payments 테이블 생성
        await env.DB.exec(`
          CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            payment_key TEXT UNIQUE,
            toss_payment_id TEXT,
            amount REAL NOT NULL,
            method TEXT,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'ready', 'paid', 'cancelled', 'partial_cancelled', 'failed')),
            requested_at TEXT,
            approved_at TEXT,
            cancelled_at TEXT,
            fail_reason TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
          CREATE INDEX IF NOT EXISTS idx_payments_payment_key ON payments(payment_key);
          CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        `);
      }
    } catch (tableError: any) {
      console.error('Table creation error:', tableError);
      // 테이블 생성 실패해도 계속 진행 (이미 존재할 수 있음)
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
    const discountAmount = Math.ceil(total_amount * discountRate / 100); // 소수점 올림 처리
    const finalAmount = Math.ceil(total_amount - discountAmount); // 최종 금액도 원단위로 올림

    // 주문 번호 생성
    const now = new Date();
    const orderNumber = `ORD${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

    // 각 상품마다 개별 주문 생성
    const orderIds: number[] = [];
    
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      // 각 주문마다 고유한 주문 번호 생성
      const contentOrderNumber = `${orderNumber}-${String(i + 1).padStart(3, '0')}`;
      
      // 각 상품의 할인 금액 계산
      const contentDiscountAmount = Math.ceil(content.price * discountRate / 100); // 소수점 올림 처리
      const contentFinalAmount = Math.ceil(content.price - contentDiscountAmount); // 최종 금액도 원단위로 올림
      
      const orderResult = await env.DB.prepare(
        `INSERT INTO orders (user_id, content_id, order_number, total_amount, discount_amount, final_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      )
        .bind(tokenData.userId, content.id, contentOrderNumber, content.price, contentDiscountAmount, contentFinalAmount)
        .run();

      if (!orderResult.success) {
        console.error(`주문 생성 실패: content_id=${content.id}`);
        continue;
      }
      
      const orderId = orderResult.meta.last_row_id;
      orderIds.push(orderId);
    }

    if (orderIds.length === 0) {
      return new Response(
        JSON.stringify({ error: '주문 생성에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 첫 번째 주문 ID를 메인으로 사용 (호환성을 위해)
    const orderId = orderIds[0];

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

