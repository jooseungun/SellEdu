// Cloudflare Pages Function for updating user role

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
    // 관리자 권한 확인
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 토큰에서 사용자 정보 추출
    const token = authHeader.replace('Bearer ', '');
    let currentUser;
    try {
      const decoded = JSON.parse(atob(token));
      currentUser = decoded;
    } catch {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 토큰입니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 관리자만 접근 가능
    if (currentUser.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId || !role) {
      return new Response(
        JSON.stringify({ error: '사용자 ID와 역할이 필요합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 역할입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 사용자 존재 확인
    const user = await env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    )
      .bind(userId)
      .first();

    if (!user) {
      return new Response(
        JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 역할 업데이트
    await env.DB.prepare(
      'UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?'
    )
      .bind(role, userId)
      .run();

    // 역할에 따라 buyers/sellers 테이블 관리
    if (role === 'admin') {
      // 관리자로 변경 시 buyers/sellers 레코드 삭제
      await env.DB.prepare('DELETE FROM buyers WHERE user_id = ?').bind(userId).run();
      await env.DB.prepare('DELETE FROM sellers WHERE user_id = ?').bind(userId).run();
    } else {
      // buyer/seller로 변경 시 필요한 레코드 생성
      if (role === 'buyer' || role === 'seller') {
        // buyers 레코드 확인 및 생성
        const buyer = await env.DB.prepare('SELECT id FROM buyers WHERE user_id = ?').bind(userId).first();
        if (!buyer) {
          await env.DB.prepare(
            `INSERT INTO buyers (user_id, grade, discount_rate, total_purchase_amount, recent_purchase_amount, recent_months)
             VALUES (?, 'BRONZE', 0.00, 0.00, 0.00, 3)`
          ).bind(userId).run();
        }

        // seller로 변경 시 sellers 레코드 생성
        if (role === 'seller') {
          const seller = await env.DB.prepare('SELECT id FROM sellers WHERE user_id = ?').bind(userId).first();
          if (!seller) {
            await env.DB.prepare(
              `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount, recent_months)
               VALUES (?, 'BRONZE', 10.00, 0.00, 0.00, 3)`
            ).bind(userId).run();
          }
        } else {
          // buyer로 변경 시 sellers 레코드 삭제
          await env.DB.prepare('DELETE FROM sellers WHERE user_id = ?').bind(userId).run();
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: '사용자 역할이 변경되었습니다.',
        userId,
        role
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update role error:', error);
    return new Response(
      JSON.stringify({
        error: '역할 변경에 실패했습니다.',
        details: error.message || 'Unknown error'
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

