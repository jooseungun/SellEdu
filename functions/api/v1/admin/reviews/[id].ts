import { D1Database } from '@cloudflare/workers-types';

export async function onRequestDelete({ params, env }: {
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
    const reviewId = params.id;

    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: '리뷰 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 리뷰 존재 확인
    const review = await env.DB.prepare('SELECT id FROM reviews WHERE id = ?')
      .bind(reviewId)
      .first<{ id: number }>();

    if (!review) {
      return new Response(
        JSON.stringify({ error: '리뷰를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 리뷰 삭제
    await env.DB.prepare('DELETE FROM reviews WHERE id = ?')
      .bind(reviewId)
      .run();

    return new Response(
      JSON.stringify({ message: '리뷰가 삭제되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Delete review error:', error);
    return new Response(
      JSON.stringify({ error: '리뷰 삭제에 실패했습니다.', details: error.message }),
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

