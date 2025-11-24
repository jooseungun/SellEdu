// 콘텐츠별 공개 후기 조회 API (인증 불필요)

import { D1Database } from '@cloudflare/workers-types';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestGet({ params, env }: {
  params: { id: string };
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    const contentId = params.id;

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 해당 콘텐츠의 모든 후기 조회
    const reviews = await env.DB.prepare(`
      SELECT 
        r.id,
        r.content_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        u.username as buyer_username,
        u.name as buyer_name
      FROM reviews r
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.content_id = ?
      ORDER BY r.created_at DESC
    `)
      .bind(contentId)
      .all<{
        id: number;
        content_id: number;
        rating: number;
        comment: string | null;
        created_at: string;
        updated_at: string;
        buyer_username: string;
        buyer_name: string | null;
      }>();

    return new Response(
      JSON.stringify({
        reviews: reviews.results || [],
        total_count: reviews.results?.length || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get content reviews error:', error);
    return new Response(
      JSON.stringify({
        error: '후기 조회에 실패했습니다.',
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

