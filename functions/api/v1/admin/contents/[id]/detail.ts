import { D1Database } from '@cloudflare/workers-types';

export async function onRequestGet({ params, env }: {
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
    const contentId = params.id;

    // 콘텐츠 상세 정보 조회
    const contentResult = await env.DB.prepare(
      `SELECT
        c.id,
        c.seller_id,
        c.title,
        c.description,
        c.detailed_description,
        c.thumbnail_url,
        c.price,
        c.category,
        c.grade,
        c.age_rating,
        c.status,
        c.display_order,
        c.content_area,
        c.education_period,
        c.sale_start_date,
        c.sale_end_date,
        c.is_always_on_sale,
        c.rejection_reason,
        c.is_reapply,
        c.created_at,
        c.updated_at,
        u.username as seller_username,
        u.email as seller_email
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.id = ?`
    )
      .bind(contentId)
      .first();

    if (!contentResult) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 차시 정보 조회
    const lessonsResult = await env.DB.prepare(
      `SELECT
        id,
        lesson_number,
        title,
        description,
        cdn_link,
        duration,
        display_order
      FROM content_lessons
      WHERE content_id = ?
      ORDER BY display_order ASC, lesson_number ASC`
    )
      .bind(contentId)
      .all();

    return new Response(
      JSON.stringify({
        ...contentResult,
        lessons: lessonsResult.results || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get content detail error:', error);
    return new Response(
      JSON.stringify({ error: '콘텐츠 상세 정보 조회에 실패했습니다.', details: error.message }),
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

