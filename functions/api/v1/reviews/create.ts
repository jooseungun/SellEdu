// 후기 작성 API (구매 확인 포함)

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestPost({ request, env }: {
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

    // Request body 파싱
    let body: any;
    try {
      body = await request.json();
    } catch (parseError: any) {
      return new Response(
        JSON.stringify({ error: '요청 데이터 형식이 올바르지 않습니다.', details: parseError?.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { content_id, rating, comment } = body;

    // 필수 필드 검증
    if (!content_id || !rating) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID와 평점은 필수입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 평점 범위 검증
    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: '평점은 1~5 사이의 값이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 구매 확인 (결제 완료된 주문이 있는지 확인)
    const purchaseCheck = await env.DB.prepare(`
      SELECT id FROM orders 
      WHERE user_id = ? AND content_id = ? AND status = 'paid'
      LIMIT 1
    `)
      .bind(userId, content_id)
      .first();

    if (!purchaseCheck) {
      return new Response(
        JSON.stringify({ error: '구매한 콘텐츠에만 후기를 작성할 수 있습니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 이미 작성한 후기가 있는지 확인
    const existingReview = await env.DB.prepare(`
      SELECT id FROM reviews 
      WHERE user_id = ? AND content_id = ?
      LIMIT 1
    `)
      .bind(userId, content_id)
      .first();

    if (existingReview) {
      return new Response(
        JSON.stringify({ error: '이미 이 콘텐츠에 대한 후기를 작성하셨습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 후기 작성
    const insertResult = await env.DB.prepare(`
      INSERT INTO reviews (content_id, user_id, rating, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(content_id, userId, rating, comment || null)
      .run();

    const reviewId = insertResult.meta.last_row_id;

    // 콘텐츠 평점 업데이트
    const ratingStats = await env.DB.prepare(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
      FROM reviews
      WHERE content_id = ?
    `)
      .bind(content_id)
      .first<{ avg_rating: number; review_count: number }>();

    if (ratingStats) {
      await env.DB.prepare(`
        UPDATE contents 
        SET avg_rating = ?,
            review_count = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `)
        .bind(
          ratingStats.avg_rating ? Math.round(ratingStats.avg_rating * 10) / 10 : null,
          ratingStats.review_count,
          content_id
        )
        .run();
    }

    return new Response(
      JSON.stringify({
        message: '후기가 작성되었습니다.',
        review_id: reviewId
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Create review error:', error);
    return new Response(
      JSON.stringify({
        error: '후기 작성에 실패했습니다.',
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

