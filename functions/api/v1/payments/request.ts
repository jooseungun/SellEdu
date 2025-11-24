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

    // 데이터베이스 테이블 확인 및 생성
    try {
      const ordersTableCheck = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='orders'"
      ).first();

      if (!ordersTableCheck) {
        // orders 테이블 생성 (각 SQL 문을 개별적으로 실행)
        await env.DB.prepare(`
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
          )
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_orders_content_id ON orders(content_id)
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
        `).run();

        // payments 테이블 생성
        await env.DB.prepare(`
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
          )
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_payments_payment_key ON payments(payment_key)
        `).run();

        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)
        `).run();
      }
    } catch (tableError: any) {
      console.error('Table creation error:', tableError);
      // 테이블 생성 실패해도 계속 진행 (이미 존재할 수 있음)
    }

    let body: any;
    try {
      body = await request.json();
    } catch (jsonError: any) {
      console.error('JSON parsing error:', jsonError);
      return new Response(
        JSON.stringify({ error: '요청 데이터 형식이 올바르지 않습니다.', details: jsonError?.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { content_id, amount } = body || {};

    console.log('Payment request - Received data:', { content_id, amount, body });

    if (!content_id || content_id === null || content_id === undefined) {
      console.error('Payment request - Missing content_id');
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.', details: `content_id: ${content_id}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!amount || amount === null || amount === undefined || amount <= 0) {
      console.error('Payment request - Invalid amount:', amount);
      return new Response(
        JSON.stringify({ error: '유효한 결제 금액이 필요합니다.', details: `amount: ${amount}` }),
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
      console.log('Payment request - Already purchased:', { userId: tokenData.userId, contentId: content_id });
      return new Response(
        JSON.stringify({ error: '이미 구매한 콘텐츠입니다.', details: `order_id: ${existingOrder.id}` }),
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
    const discountAmount = Math.ceil(amount * discountRate / 100); // 소수점 올림 처리
    const finalAmount = Math.ceil(amount - discountAmount); // 최종 금액도 원단위로 올림

    // 주문 생성
    const orderResult = await env.DB.prepare(
      `INSERT INTO orders (user_id, content_id, order_number, total_amount, discount_amount, final_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    )
      .bind(tokenData.userId, content_id, orderNumber, amount, discountAmount, finalAmount)
      .run();

    if (!orderResult.success) {
      return new Response(
        JSON.stringify({ error: '주문 생성에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const orderId = orderResult.meta.last_row_id;

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

