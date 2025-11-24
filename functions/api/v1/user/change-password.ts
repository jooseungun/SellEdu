// 비밀번호 변경 API

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

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
    const { current_password, new_password } = body;

    // 필수 필드 검증
    if (!current_password || !new_password) {
      return new Response(
        JSON.stringify({ error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 새 비밀번호 길이 검증
    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 현재 비밀번호와 새 비밀번호가 같은지 확인
    if (current_password === new_password) {
      return new Response(
        JSON.stringify({ error: '새 비밀번호는 현재 비밀번호와 달라야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 사용자 정보 조회
    const user = await env.DB.prepare(
      'SELECT id, password_hash FROM users WHERE id = ?'
    )
      .bind(tokenData.userId)
      .first<{ id: number; password_hash: string }>();

    if (!user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 현재 비밀번호 확인
    const encoder = new TextEncoder();
    const currentPasswordData = encoder.encode(current_password);
    const currentPasswordHashBuffer = await crypto.subtle.digest('SHA-256', currentPasswordData);
    const currentPasswordHashArray = Array.from(new Uint8Array(currentPasswordHashBuffer));
    const currentPasswordHash = currentPasswordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (currentPasswordHash !== user.password_hash) {
      return new Response(
        JSON.stringify({ error: '현재 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 새 비밀번호 해시 생성
    const newPasswordData = encoder.encode(new_password);
    const newPasswordHashBuffer = await crypto.subtle.digest('SHA-256', newPasswordData);
    const newPasswordHashArray = Array.from(new Uint8Array(newPasswordHashBuffer));
    const newPasswordHash = newPasswordHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 비밀번호 업데이트
    await env.DB.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
    )
      .bind(newPasswordHash, tokenData.userId)
      .run();

    return new Response(
      JSON.stringify({ message: '비밀번호가 변경되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Change password error:', error);
    return new Response(
      JSON.stringify({
        error: '비밀번호 변경에 실패했습니다.',
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

