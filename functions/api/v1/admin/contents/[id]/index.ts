// 콘텐츠 정보 업데이트 API (관리자용)

import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../../utils/token';

export async function onRequestPut({ params, request, env }: {
  params: { id: string };
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
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

    const contentId = params.id;
    const body = await request.json();
    const { thumbnail_url } = body || {};

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 존재 확인
    const content = await env.DB.prepare('SELECT id FROM contents WHERE id = ?')
      .bind(contentId)
      .first<{ id: number }>();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 썸네일 URL 업데이트
    await env.DB.prepare(
      `UPDATE contents 
       SET thumbnail_url = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(thumbnail_url || null, contentId)
      .run();

    return new Response(
      JSON.stringify({ message: '콘텐츠 썸네일이 업데이트되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update content thumbnail error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 썸네일 업데이트에 실패했습니다.', 
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestDelete({ params, request, env }: {
  params: { id: string };
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    const contentId = params.id;

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: '콘텐츠 ID가 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 존재 확인
    const content = await env.DB.prepare('SELECT id, title FROM contents WHERE id = ?')
      .bind(contentId)
      .first<{ id: number; title: string }>();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 관련 데이터 확인 (주문이 있는지 확인)
    const orderCheck = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM orders WHERE content_id = ?'
    )
      .bind(contentId)
      .first<{ count: number }>();

    if (orderCheck && orderCheck.count > 0) {
      return new Response(
        JSON.stringify({ 
          error: '이 콘텐츠는 판매 내역이 있어 삭제할 수 없습니다.',
          details: `판매된 주문이 ${orderCheck.count}건 있습니다.`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 삭제 (CASCADE로 관련 데이터도 자동 삭제됨)
    await env.DB.prepare('DELETE FROM contents WHERE id = ?')
      .bind(contentId)
      .run();

    return new Response(
      JSON.stringify({ message: '콘텐츠가 삭제되었습니다.' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Delete content error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 삭제에 실패했습니다.', 
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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

