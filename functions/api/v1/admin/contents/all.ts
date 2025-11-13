import { D1Database } from '@cloudflare/workers-types';

export async function onRequestGet({ request, env }: {
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
    // 테이블 존재 확인
    const tableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='contents'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 테이블이 없습니다.',
          details: 'contents 테이블이 존재하지 않습니다. /api/v1/admin/init-db를 호출하여 데이터베이스를 초기화해주세요.',
          needsInit: true
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const result = await env.DB.prepare(
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
        c.purchase_count,
        c.avg_rating,
        c.review_count,
        c.duration,
        c.education_period,
        c.created_at,
        c.updated_at,
        c.approved_at,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      ORDER BY c.display_order ASC, c.created_at DESC`
    ).all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get all contents error:', error);
    const errorMessage = error.message || 'Unknown error';
    const needsInit = errorMessage.includes('no such table') || errorMessage.includes('TABLE_NOT_FOUND');
    
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 목록 조회에 실패했습니다.', 
        details: errorMessage,
        needsInit
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

