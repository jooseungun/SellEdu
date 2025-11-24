// 훌라로 관련 제휴할인 신청 데이터 삭제 API

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

    // 훌라로 관련 제휴할인 신청 삭제
    const deleteResult = await env.DB.prepare(
      'DELETE FROM partnership_requests WHERE type = ?'
    )
      .bind('hula')
      .run();

    // 훌라로로 승인된 사용자의 할인율 초기화
    const hulaUsers = await env.DB.prepare(
      `SELECT DISTINCT pr.user_id 
       FROM partnership_requests pr
       WHERE pr.type = 'hula' AND pr.status = 'approved'`
    ).all<{ user_id: number }>();

    let resetCount = 0;
    if (hulaUsers.results && hulaUsers.results.length > 0) {
      for (const user of hulaUsers.results) {
        await env.DB.prepare(
          'UPDATE buyers SET discount_rate = 0 WHERE user_id = ?'
        )
          .bind(user.user_id)
          .run();
        resetCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: '훌라로 관련 제휴할인 신청이 삭제되었습니다.',
        deleted_count: deleteResult.meta.changes || 0,
        reset_discount_count: resetCount
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Clear hula partnership error:', error);
    return new Response(
      JSON.stringify({
        error: '훌라로 데이터 삭제에 실패했습니다.',
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

