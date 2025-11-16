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
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: corsHeaders }
      );
    }

    // users 테이블과 buyers, sellers 테이블을 LEFT JOIN하여 모든 회원 정보 조회
    const result = await env.DB.prepare(
      `SELECT
        u.id,
        u.username,
        u.name,
        u.email,
        u.phone,
        u.mobile,
        u.role,
        u.created_at,
        u.updated_at,
        b.grade as buyer_grade,
        s.grade as seller_grade
      FROM users u
      LEFT JOIN buyers b ON u.id = b.user_id
      LEFT JOIN sellers s ON u.id = s.user_id
      ORDER BY u.created_at DESC`
    ).all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return new Response(
      JSON.stringify({ error: '회원 목록 조회에 실패했습니다.', details: error.message }),
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

