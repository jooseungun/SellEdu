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
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify([]),
        { status: 200, headers: corsHeaders }
      );
    }

    // users 테이블과 buyers, sellers, user_roles 테이블을 LEFT JOIN하여 모든 회원 정보 조회
    const usersResult = await env.DB.prepare(
      `SELECT
        u.id,
        u.username,
        u.name,
        u.email,
        u.phone,
        u.mobile,
        u.role,
        u.created_at,
        u.updated_at,
        b.grade as buyer_grade,
        s.grade as seller_grade
      FROM users u
      LEFT JOIN buyers b ON u.id = b.user_id
      LEFT JOIN sellers s ON u.id = s.user_id
      ORDER BY u.created_at DESC`
    ).all();

    // 각 사용자의 권한 정보 조회
    const users = usersResult.results || [];
    const usersWithRoles = await Promise.all(
      users.map(async (user: any) => {
        try {
          const userRolesTableCheck = await env.DB.prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='user_roles'"
          ).first();

          let roles: string[] = [];
          if (userRolesTableCheck) {
            const rolesResult = await env.DB.prepare(
              'SELECT role FROM user_roles WHERE user_id = ?'
            )
              .bind(user.id)
              .all<{ role: string }>();

            roles = rolesResult.results?.map(r => r.role) || [];
          }

          // user_roles 테이블이 없거나 권한이 없으면 기존 role 필드 사용
          if (roles.length === 0) {
            roles = user.role ? [user.role] : ['buyer'];
          }

          return {
            ...user,
            roles
          };
        } catch (error) {
          // 권한 조회 실패 시 기존 role 필드 사용
          return {
            ...user,
            roles: user.role ? [user.role] : ['buyer']
          };
        }
      })
    );

    return new Response(
      JSON.stringify(usersWithRoles),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return new Response(
      JSON.stringify({ error: '회원 목록 조회에 실패했습니다.', details: error.message }),
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

