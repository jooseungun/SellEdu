// 관리자용 후기 조회 API

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../utils/token';

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
    if (!tokenData || !tokenData.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

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
        u.username as buyer_username,
        u.name as buyer_name,
        seller.username as seller_username,
        seller.name as seller_name
      FROM reviews r
      INNER JOIN contents c ON r.content_id = c.id
      INNER JOIN users u ON r.user_id = u.id
      LEFT JOIN users seller ON c.seller_id = seller.id
      WHERE 1=1
    `;

    const params: any[] = [];

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
        buyer_username: string;
        buyer_name: string | null;
        seller_username: string | null;
        seller_name: string | null;
      }>();

    return new Response(
      JSON.stringify({
        reviews: reviews.results || [],
        total_count: reviews.results?.length || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get admin reviews error:', error);
    return new Response(
      JSON.stringify({
        error: '후기 조회에 실패했습니다.',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestDelete({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData || !tokenData.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);
    const reviewId = url.searchParams.get('id');

    if (!reviewId) {
      return new Response(
        JSON.stringify({ error: '후기 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 후기 정보 조회 (콘텐츠 ID 확인용)
    const review = await env.DB.prepare(`
      SELECT content_id FROM reviews WHERE id = ?
    `)
      .bind(reviewId)
      .first<{ content_id: number }>();

    if (!review) {
      return new Response(
        JSON.stringify({ error: '후기를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 후기 삭제
    await env.DB.prepare('DELETE FROM reviews WHERE id = ?')
      .bind(reviewId)
      .run();

    // 콘텐츠 평점 업데이트
    const ratingStats = await env.DB.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
      FROM reviews
      WHERE content_id = ?
    `)
      .bind(review.content_id)
      .first<{ avg_rating: number | null; review_count: number }>();

    await env.DB.prepare(`
      UPDATE contents 
      SET avg_rating = ?,
          review_count = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `)
      .bind(
        ratingStats?.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : null,
        ratingStats?.review_count || 0,
        review.content_id
      )
      .run();

    return new Response(
      JSON.stringify({
        message: '후기가 삭제되었습니다.'
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Delete review error:', error);
    return new Response(
      JSON.stringify({
        error: '후기 삭제에 실패했습니다.',
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

