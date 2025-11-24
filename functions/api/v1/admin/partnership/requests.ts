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
      "SELECT name FROM sqlite_master WHERE type='table' AND name='partnership_requests'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: corsHeaders }
      );
    }

    // 훌라로 관련 데이터는 제외하고 맑은소프트만 조회
    const result = await env.DB.prepare(
      `SELECT
        pr.id,
        pr.user_id,
        pr.type,
        pr.company_name,
        pr.status,
        pr.rejection_reason,
        pr.created_at,
        pr.updated_at,
        u.username,
        u.name,
        u.email
      FROM partnership_requests pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.type = 'malgn'
      ORDER BY pr.created_at DESC`
    ).all();

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get partnership requests error:', error);
    return new Response(
      JSON.stringify({ error: '제휴할인 신청 목록 조회에 실패했습니다.', details: error.message }),
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

