import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 장바구니 추가 API

export async function onRequestPost({ request, env }: {
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

    const body = await request.json();
    const { content_id, quantity = 1 } = body;

    if (!content_id) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 존재 및 승인 여부 확인
    const content = await env.DB.prepare(
      'SELECT id, title, price, status FROM contents WHERE id = ? AND status = ?'
    )
      .bind(content_id, 'approved')
      .first<{ id: number; title: string; price: number; status: string }>();

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

    // 이미 장바구니에 있는지 확인
    const existingCartItem = await env.DB.prepare(
      'SELECT id, quantity FROM cart WHERE user_id = ? AND content_id = ?'
    )
      .bind(tokenData.userId, content_id)
      .first<{ id: number; quantity: number }>();

    if (existingCartItem) {
      // 수량 업데이트
      await env.DB.prepare(
        `UPDATE cart 
         SET quantity = quantity + ?, updated_at = datetime('now')
         WHERE id = ?`
      )
        .bind(quantity, existingCartItem.id)
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          message: '장바구니에 추가되었습니다.',
          cartItemId: existingCartItem.id
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // 장바구니에 추가
    const result = await env.DB.prepare(
      `INSERT INTO cart (user_id, content_id, quantity, created_at, updated_at)
       VALUES (?, ?, ?, datetime('now'), datetime('now'))
       RETURNING id`
    )
      .bind(tokenData.userId, content_id, quantity)
      .first<{ id: number }>();

    if (!result) {
      return new Response(
        JSON.stringify({ error: '장바구니 추가에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '장바구니에 추가되었습니다.',
        cartItemId: result.id
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Cart add error:', error);
    return new Response(
      JSON.stringify({
        error: '장바구니 추가 중 오류가 발생했습니다.',
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

