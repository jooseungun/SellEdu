import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPut({ request, env }: {
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
    const body = await request.json();
    const { orders } = body || {}; // orders: [{ id: 1, display_order: 0 }, ...]

    if (!orders || !Array.isArray(orders)) {
      return new Response(
        JSON.stringify({ error: '정렬 순서 정보가 올바르지 않습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 트랜잭션으로 일괄 업데이트
    for (const order of orders) {
      if (order.id && typeof order.display_order === 'number') {
        await env.DB.prepare(
          'UPDATE contents SET display_order = ?, updated_at = datetime(\'now\') WHERE id = ?'
        )
          .bind(order.display_order, order.id)
          .run();
      }
    }

    return new Response(
      JSON.stringify({ message: '정렬 순서가 업데이트되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update order error:', error);
    return new Response(
      JSON.stringify({ error: '정렬 순서 업데이트에 실패했습니다.', details: error.message }),
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

