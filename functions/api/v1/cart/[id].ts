import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 장바구니 항목 수정/삭제 API

export async function onRequestPut({ request, env, params }: {
  request: Request;
  env: {
    DB: D1Database;
  };
  params: { id: string };
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

    const cartItemId = parseInt(params.id);
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return new Response(
        JSON.stringify({ error: '수량은 1 이상이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 장바구니 항목 소유자 확인
    const cartItem = await env.DB.prepare(
      'SELECT id, user_id FROM cart WHERE id = ?'
    )
      .bind(cartItemId)
      .first<{ id: number; user_id: number }>();

    if (!cartItem) {
      return new Response(
        JSON.stringify({ error: '장바구니 항목을 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (cartItem.user_id !== tokenData.userId) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 수량 업데이트
    await env.DB.prepare(
      `UPDATE cart 
       SET quantity = ?, updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(quantity, cartItemId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '수량이 업데이트되었습니다.'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Cart update error:', error);
    return new Response(
      JSON.stringify({
        error: '장바구니 수정 중 오류가 발생했습니다.',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestDelete({ request, env, params }: {
  request: Request;
  env: {
    DB: D1Database;
  };
  params: { id: string };
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

    const cartItemId = parseInt(params.id);

    // 장바구니 항목 소유자 확인
    const cartItem = await env.DB.prepare(
      'SELECT id, user_id FROM cart WHERE id = ?'
    )
      .bind(cartItemId)
      .first<{ id: number; user_id: number }>();

    if (!cartItem) {
      return new Response(
        JSON.stringify({ error: '장바구니 항목을 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (cartItem.user_id !== tokenData.userId) {
      return new Response(
        JSON.stringify({ error: '권한이 없습니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 장바구니 항목 삭제
    await env.DB.prepare('DELETE FROM cart WHERE id = ?')
      .bind(cartItemId)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '장바구니에서 삭제되었습니다.'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Cart delete error:', error);
    return new Response(
      JSON.stringify({
        error: '장바구니 삭제 중 오류가 발생했습니다.',
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

