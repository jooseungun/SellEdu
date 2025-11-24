// 기존 후기 데이터 삭제 API

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData || !tokenData.roles?.includes('admin')) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 모든 후기 삭제
    const deleteResult = await env.DB.prepare('DELETE FROM reviews').run();

    // 모든 콘텐츠의 평점 초기화
    await env.DB.prepare(`
      UPDATE contents 
      SET avg_rating = NULL, 
          review_count = 0,
          updated_at = datetime('now')
    `).run();

    return new Response(
      JSON.stringify({
        message: '모든 후기와 평점이 삭제되었습니다.',
        deleted_count: deleteResult.meta.changes || 0
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Clear reviews error:', error);
    return new Response(
      JSON.stringify({
        error: '후기 삭제에 실패했습니다.',
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

