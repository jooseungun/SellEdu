import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

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
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      console.error('Content apply - No token data');
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다. 판매자 계정으로 로그인해주세요.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const sellerId = tokenData.userId;
    console.log('Content apply - Seller ID:', sellerId);

    // Request body 파싱
    let body: any;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('Content apply - JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: '요청 데이터 형식이 올바르지 않습니다.', details: parseError?.message }),
        { status: 400, headers: corsHeaders }
      );
    }
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
      console.log('Content apply - Inserting lessons:', lessons.length);
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        // lesson이 존재하고 필수 필드가 있는지 확인
        if (lesson && typeof lesson === 'object' && lesson.title && lesson.cdn_link) {
          try {
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
                (lesson.duration && typeof lesson.duration === 'number') ? lesson.duration : 0,
                i
              )
              .run();
            console.log('Content apply - Lesson inserted:', i + 1);
          } catch (lessonError: any) {
            console.error('Content apply - Lesson insert error:', lessonError);
            // 차시 삽입 실패해도 계속 진행
          }
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
    console.error('Content apply error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack
    });
    
    // 에러 메시지 안전하게 추출
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 심사 신청에 실패했습니다.', 
        details: errorMessage
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

