import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPut({ request, env }: {
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
    const { userId, role } = body;

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: '사용자 ID와 역할이 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 역할 유효성 검사
    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 역할입니다. (buyer, seller, admin 중 하나여야 합니다.)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 테이블 존재 확인
    const tableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify({ error: 'users 테이블이 존재하지 않습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 사용자 존재 확인
    const user = await env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(userId).first<{ id: number; role: string }>();

    if (!user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 역할 업데이트
    await env.DB.prepare(
      'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(role, userId).run();

    return new Response(
      JSON.stringify({ message: '역할이 성공적으로 변경되었습니다.', userId, role }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update user role error:', error);
    return new Response(
      JSON.stringify({ error: '역할 변경에 실패했습니다.', details: error.message }),
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

