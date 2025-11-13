import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPost({ request, env }: {
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
    const {
      title,
      description,
      detailed_description,
      thumbnail_url,
      price,
      category,
      education_period,
      sale_start_date,
      sale_end_date,
      is_always_on_sale,
      lessons
    } = body;

    // 필수 필드 검증
    if (!title || !category) {
      return new Response(
        JSON.stringify({ error: '제목과 카테고리는 필수입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Authorization 헤더에서 판매자 ID 읽기
    const authHeader = request.headers.get('Authorization');
    let sellerId: number | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const tokenData = JSON.parse(atob(token));
        sellerId = tokenData.userId || null;
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }

    // 토큰이 없으면 joosu 계정 사용 (프로토타입)
    if (!sellerId) {
      const joosuUser = await env.DB.prepare(
        'SELECT id FROM users WHERE username = ?'
      )
        .bind('joosu')
        .first<{ id: number }>();

      if (joosuUser) {
        sellerId = joosuUser.id;
      } else {
        return new Response(
          JSON.stringify({ error: '판매자 계정을 찾을 수 없습니다.' }),
          { status: 404, headers: corsHeaders }
        );
      }
    }

    // 콘텐츠 삽입
    const contentResult = await env.DB.prepare(
      `INSERT INTO contents (
        seller_id, title, description, detailed_description, thumbnail_url, price, category,
        education_period, sale_start_date, sale_end_date, is_always_on_sale,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))`
    )
      .bind(
        sellerId,
        title,
        description || null,
        detailed_description || null,
        thumbnail_url || null,
        price || 0,
        category,
        education_period || null,
        sale_start_date || null,
        sale_end_date || null,
        is_always_on_sale ? 1 : 0
      )
      .run();

    const contentId = contentResult.meta.last_row_id;

    // 차시 삽입
    if (lessons && Array.isArray(lessons) && lessons.length > 0) {
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        if (lesson.title && lesson.cdn_link) {
          await env.DB.prepare(
            `INSERT INTO content_lessons (
              content_id, lesson_number, title, cdn_link, duration, display_order, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
          )
            .bind(
              contentId,
              i + 1,
              lesson.title,
              lesson.cdn_link,
              lesson.duration || 0,
              i
            )
            .run();
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: '콘텐츠 심사 신청이 완료되었습니다.',
        content_id: contentId
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Content apply error:', error);
    return new Response(
      JSON.stringify({ error: '콘텐츠 심사 신청에 실패했습니다.', details: error.message }),
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

