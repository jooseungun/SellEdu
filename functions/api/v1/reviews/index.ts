// 후기 조회 API (구매자용 - 자신이 작성한 후기)

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestGet({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = tokenData.userId;
    const url = new URL(request.url);
    const contentId = url.searchParams.get('content_id');

    let query = `
      SELECT 
        r.id,
        r.content_id,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        c.title as content_title,
        c.thumbnail_url
      FROM reviews r
      INNER JOIN contents c ON r.content_id = c.id
      WHERE r.user_id = ?
    `;

    const params: any[] = [userId];

    if (contentId) {
      query += ' AND r.content_id = ?';
      params.push(contentId);
    }

    query += ' ORDER BY r.created_at DESC';

    const reviews = await env.DB.prepare(query)
      .bind(...params)
      .all<{
        id: number;
        content_id: number;
        rating: number;
        comment: string | null;
        created_at: string;
        updated_at: string;
        content_title: string;
        thumbnail_url: string | null;
      }>();

    return new Response(
      JSON.stringify({
        reviews: reviews.results || [],
        total_count: reviews.results?.length || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get reviews error:', error);
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

