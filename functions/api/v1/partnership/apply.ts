import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPost({ request, env }: {
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
    const { type, company_name } = body;

    if (!type || !company_name) {
      return new Response(
        JSON.stringify({ error: '제휴사와 고객사 명을 입력해주세요.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Authorization 헤더에서 토큰 읽기
    const authHeader = request.headers.get('Authorization');
    let userId: number | null = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const tokenData = JSON.parse(atob(token));
        userId = tokenData.userId || null;
      } catch (e) {
        console.error('Token parsing error:', e);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 기존 신청 확인
    const existingRequest = await env.DB.prepare(
      'SELECT id, status FROM partnership_requests WHERE user_id = ? AND status IN ("pending", "reviewing", "approved")'
    )
      .bind(userId)
      .first<{ id: number; status: string }>();

    if (existingRequest) {
      return new Response(
        JSON.stringify({ error: '이미 제휴할인 신청이 진행 중입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 제휴할인 신청 테이블이 없으면 생성
    try {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS partnership_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          company_name TEXT NOT NULL,
          status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewing', 'approved', 'rejected')),
          rejection_reason TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `).run();

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_partnership_user_id ON partnership_requests(user_id)
      `).run();
    } catch (e) {
      // 테이블이 이미 존재하면 무시
    }

    // 신청 저장
    const result = await env.DB.prepare(
      `INSERT INTO partnership_requests (user_id, type, company_name, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', datetime('now'), datetime('now'))`
    )
      .bind(userId, type, company_name)
      .run();

    return new Response(
      JSON.stringify({
        message: '제휴할인 신청이 완료되었습니다.',
        request_id: result.meta.last_row_id
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Partnership apply error:', error);
    return new Response(
      JSON.stringify({ error: '제휴할인 신청에 실패했습니다.', details: error.message }),
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

