// Cloudflare Pages Function for admin user management

// 회원 목록 조회
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
    // 모든 회원 조회 (비밀번호 해시 제외)
    const result = await env.DB.prepare(
      `SELECT 
        u.id,
        u.username,
        u.email,
        u.name,
        u.birth_date,
        u.phone,
        u.mobile,
        u.role,
        u.created_at,
        u.updated_at,
        b.grade as buyer_grade,
        b.total_purchase_amount,
        s.grade as seller_grade,
        s.total_sales_amount
      FROM users u
      LEFT JOIN buyers b ON u.id = b.user_id
      LEFT JOIN sellers s ON u.id = s.user_id
      ORDER BY u.created_at DESC`
    ).all();
    
    const users = result.results || [];

    return new Response(
      JSON.stringify(users),
      { 
        status: 200, 
        headers: corsHeaders
      }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return new Response(
      JSON.stringify({ error: '회원 목록 조회에 실패했습니다.', details: error.message }),
      { 
        status: 500, 
        headers: corsHeaders
      }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
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
