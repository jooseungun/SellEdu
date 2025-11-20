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
    const { userId, roles } = body;

    if (!userId || !roles) {
      return new Response(
        JSON.stringify({ error: '사용자 ID와 권한 목록이 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // roles 유효성 검사
    if (!Array.isArray(roles)) {
      return new Response(
        JSON.stringify({ error: '권한은 배열 형식이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const validRoles = ['buyer', 'seller', 'admin'];
    const invalidRoles = roles.filter((r: string) => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: `유효하지 않은 권한입니다: ${invalidRoles.join(', ')}` }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (roles.length === 0) {
      return new Response(
        JSON.stringify({ error: '최소 하나 이상의 권한을 선택해야 합니다.' }),
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

    // user_roles 테이블 확인 및 생성
    const userRolesTableCheck = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_roles'"
    ).first();

    if (!userRolesTableCheck) {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS user_roles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('buyer', 'seller', 'admin')),
          created_at TEXT DEFAULT (datetime('now')),
          UNIQUE(user_id, role),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
      `);
    }

    // 기존 권한 삭제
    await env.DB.prepare(
      'DELETE FROM user_roles WHERE user_id = ?'
    ).bind(userId).run();

    // 새로운 권한 추가
    for (const role of roles) {
      await env.DB.prepare(
        `INSERT INTO user_roles (user_id, role, created_at)
         VALUES (?, ?, datetime('now'))`
      )
        .bind(userId, role)
        .run();
    }

    // users 테이블의 role 필드도 업데이트 (하위 호환성)
    const primaryRole = roles[0];
    await env.DB.prepare(
      'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?'
    ).bind(primaryRole, userId).run();

    // buyers/sellers 테이블 레코드 생성/삭제
    if (roles.includes('buyer')) {
      // buyers 레코드가 없으면 생성
      const buyerCheck = await env.DB.prepare(
        'SELECT id FROM buyers WHERE user_id = ?'
      ).bind(userId).first();

      if (!buyerCheck) {
        await env.DB.prepare(
          `INSERT INTO buyers (user_id, grade, discount_rate, total_purchase_amount, recent_purchase_amount)
           VALUES (?, 'BRONZE', 0.00, 0.00, 0.00)`
        ).bind(userId).run();
      }
    } else {
      // buyers 권한이 없으면 레코드 삭제
      await env.DB.prepare('DELETE FROM buyers WHERE user_id = ?').bind(userId).run();
    }

    if (roles.includes('seller')) {
      // sellers 레코드가 없으면 생성
      const sellerCheck = await env.DB.prepare(
        'SELECT id FROM sellers WHERE user_id = ?'
      ).bind(userId).first();

      if (!sellerCheck) {
        await env.DB.prepare(
          `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount)
           VALUES (?, 'BRONZE', 10.00, 0.00, 0.00)`
        ).bind(userId).run();
      }
    } else {
      // sellers 권한이 없으면 레코드 삭제
      await env.DB.prepare('DELETE FROM sellers WHERE user_id = ?').bind(userId).run();
    }

    return new Response(
      JSON.stringify({ message: '권한이 변경되었습니다.', roles }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update user roles error:', error);
    return new Response(
      JSON.stringify({ error: '권한 변경에 실패했습니다.', details: error.message }),
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
