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
    const contentId = params.id;
    const body = await request.json();
    const { display_order = 0, content_area = 'default' } = body || {};

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 존재 확인
    const content = await env.DB.prepare('SELECT id, status FROM contents WHERE id = ?')
      .bind(contentId)
      .first<{ id: number; status: string }>();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 승인 처리
    await env.DB.prepare(
      `UPDATE contents 
       SET status = 'approved',
           display_order = ?,
           content_area = ?,
           approved_at = datetime('now'),
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(display_order, content_area, contentId)
      .run();

    return new Response(
      JSON.stringify({ message: '콘텐츠가 승인되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Approve content error:', error);
    return new Response(
      JSON.stringify({ error: '콘텐츠 승인에 실패했습니다.', details: error.message }),
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

