// 사용자 정보 조회 및 변경 API

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// 사용자 정보 조회
export async function onRequestGet({ request, env }: {
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

    // 사용자 정보 조회 (아이디 제외)
    const user = await env.DB.prepare(
      'SELECT id, email, name, birth_date, phone, mobile, role, created_at, updated_at FROM users WHERE id = ?'
    )
      .bind(tokenData.userId)
      .first<{
        id: number;
        email: string;
        name: string;
        birth_date: string | null;
        phone: string | null;
        mobile: string | null;
        role: string;
        created_at: string;
        updated_at: string;
      }>();

    if (!user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify(user),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('User profile get error:', error);
    return new Response(
      JSON.stringify({
        error: '사용자 정보 조회에 실패했습니다.',
        details: error.message
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// 사용자 정보 변경 (아이디는 변경 불가)
export async function onRequestPut({ request, env }: {
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

    const body = await request.json();
    const { email, name, birth_date, phone, mobile } = body;

    // 이메일 형식 검증
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: '유효한 이메일 형식이 아닙니다.' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // 이메일 중복 확인 (다른 사용자가 사용 중인지)
      const existingUser = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      )
        .bind(email, tokenData.userId)
        .first<{ id: number }>();

      if (existingUser) {
        return new Response(
          JSON.stringify({ error: '이미 사용 중인 이메일입니다.' }),
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // 업데이트할 필드 구성
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (birth_date !== undefined) {
      updateFields.push('birth_date = ?');
      updateValues.push(birth_date || null);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone || null);
    }
    if (mobile !== undefined) {
      updateFields.push('mobile = ?');
      updateValues.push(mobile || null);
    }

    if (updateFields.length === 0) {
      return new Response(
        JSON.stringify({ error: '변경할 정보가 없습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // updated_at 추가
    updateFields.push('updated_at = datetime("now")');
    updateValues.push(tokenData.userId);

    // 사용자 정보 업데이트
    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query)
      .bind(...updateValues)
      .run();

    // 업데이트된 사용자 정보 조회
    const updatedUser = await env.DB.prepare(
      'SELECT id, email, name, birth_date, phone, mobile, role, created_at, updated_at FROM users WHERE id = ?'
    )
      .bind(tokenData.userId)
      .first<{
        id: number;
        email: string;
        name: string;
        birth_date: string | null;
        phone: string | null;
        mobile: string | null;
        role: string;
        created_at: string;
        updated_at: string;
      }>();

    return new Response(
      JSON.stringify({
        message: '사용자 정보가 변경되었습니다.',
        user: updatedUser
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('User profile update error:', error);
    return new Response(
      JSON.stringify({
        error: '사용자 정보 변경에 실패했습니다.',
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

