import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPost({ params, env }: {
  params: { id: string };
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

    await env.DB.prepare(
      `UPDATE partnership_requests 
       SET status = 'approved',
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(requestId)
      .run();

    return new Response(
      JSON.stringify({ message: '제휴할인 신청이 승인되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Approve partnership error:', error);
    return new Response(
      JSON.stringify({ error: '승인 처리에 실패했습니다.', details: error.message }),
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

