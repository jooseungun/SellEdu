import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPost({ params, request, env }: {
  params: { id: string };
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
    const requestId = params.id;
    const body = await request.json();
    const { reason = '' } = body || {};

    await env.DB.prepare(
      `UPDATE partnership_requests 
       SET status = 'rejected',
           rejection_reason = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(reason, requestId)
      .run();

    return new Response(
      JSON.stringify({ message: '제휴할인 신청이 거부되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Reject partnership error:', error);
    return new Response(
      JSON.stringify({ error: '거부 처리에 실패했습니다.', details: error.message }),
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

