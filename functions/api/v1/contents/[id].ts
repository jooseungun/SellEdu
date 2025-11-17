// Cloudflare Pages Function for content detail

import { D1Database } from '@cloudflare/workers-types';

export async function onRequestGet({ request, env, params }: {
  request: Request;
  env: {
    DB: D1Database;
  };
  params: {
    id: string;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    const contentId = parseInt(params.id);
    
    if (!contentId || isNaN(contentId)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 콘텐츠 ID입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 테이블 존재 확인
    const tableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='contents'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 테이블이 없습니다.',
          details: 'contents 테이블이 존재하지 않습니다.'
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 콘텐츠 조회 (승인된 콘텐츠만)
    const content = await env.DB.prepare(
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
        c.purchase_count,
        c.avg_rating,
        c.review_count,
        c.duration,
        c.education_period,
        c.sale_start_date,
        c.sale_end_date,
        c.is_always_on_sale,
        c.created_at,
        c.updated_at,
        u.username as seller_username,
        u.name as seller_name
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.id = ? AND c.status = 'approved'`
    )
      .bind(contentId)
      .first();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 강의 목차 조회 (lessons 테이블이 있는 경우)
    let lessons = [];
    try {
      const lessonsTableCheck = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='lessons'"
      ).first();

      if (lessonsTableCheck) {
        const lessonsResult = await env.DB.prepare(
          `SELECT 
            id,
            content_id,
            title,
            duration,
            display_order,
            cdn_link
          FROM lessons
          WHERE content_id = ?
          ORDER BY display_order ASC`
        )
          .bind(contentId)
          .all();
        
        lessons = lessonsResult.results || [];
      }
    } catch (lessonsError) {
      console.log('Lessons table not found or error:', lessonsError);
      // lessons 테이블이 없어도 계속 진행
    }

    // 응답 데이터 구성
    const responseData = {
      ...content,
      lessons: lessons,
      tags: content.category ? [content.category, '온라인', '실무'] : ['온라인', '실무'],
      instructor: content.seller_name || content.seller_username || '강사명'
    };

    return new Response(
      JSON.stringify(responseData),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get content detail error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 조회에 실패했습니다.', 
        details: error.message || 'Unknown error'
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

