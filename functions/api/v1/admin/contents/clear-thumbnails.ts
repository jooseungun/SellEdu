// 모든 콘텐츠의 썸네일 URL을 삭제하는 API (관리자용)

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../utils/token';

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 관리자 권한 확인
    const userRoles = tokenData.roles || (tokenData.role ? [tokenData.role] : []);
    if (!userRoles.includes('admin')) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 모든 콘텐츠의 썸네일 URL을 NULL로 업데이트
    const result = await env.DB.prepare(
      'UPDATE contents SET thumbnail_url = NULL WHERE thumbnail_url IS NOT NULL'
    ).run();

    return new Response(
      JSON.stringify({
        message: '모든 콘텐츠의 썸네일 URL이 삭제되었습니다.',
        updated_count: result.meta.changes || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Clear thumbnails error:', error);
    return new Response(
      JSON.stringify({ 
        error: '썸네일 URL 삭제에 실패했습니다.', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

