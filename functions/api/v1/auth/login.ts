// Cloudflare Pages Function for user login

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    JWT_SECRET?: string;
  };
}): Promise<Response> {
  // CORS 헤더
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    // Request body 파싱
    let body;
    try {
      body = await request.json();
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: '요청 데이터 형식이 올바르지 않습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { username, password } = body || {};

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: '아이디와 비밀번호를 입력해주세요.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // D1 데이터베이스 확인
    if (!env || !env.DB) {
      console.error('D1 Database binding is not available. env:', !!env, 'env.DB:', !!env?.DB);
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 연결에 실패했습니다.',
          details: 'D1 바인딩이 설정되지 않았습니다. Cloudflare Pages 대시보드에서 D1 바인딩을 확인해주세요.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 데이터베이스 연결 테스트 및 테이블 확인
    let tableExists = false;
    try {
      const tableCheck = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      ).first();
      tableExists = !!tableCheck;
      
      if (!tableExists) {
        console.error('users table does not exist');
        return new Response(
          JSON.stringify({ 
            error: '데이터베이스 테이블이 없습니다.',
            details: 'users 테이블이 생성되지 않았습니다. D1 데이터베이스에 스키마를 적용해주세요.'
          }),
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (tableCheckError: any) {
      console.error('Table check error:', tableCheckError);
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 연결 확인 중 오류가 발생했습니다.',
          details: tableCheckError.message || 'Unknown error'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Get user from database
    let user;
    try {
      const result = await env.DB.prepare(
        'SELECT id, username, email, password_hash, name, role FROM users WHERE username = ?'
      )
        .bind(username)
        .first();

      if (!result) {
        return new Response(
          JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
          { status: 401, headers: corsHeaders }
        );
      }

      user = result as {
        id: number;
        username: string;
        email: string;
        password_hash: string;
        name: string;
        role: string;
      };
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      console.error('Error details:', {
        message: dbError.message,
        stack: dbError.stack,
        name: dbError.name
      });
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 조회 중 오류가 발생했습니다.',
          details: dbError.message || 'Unknown database error',
          type: dbError.name || 'Error'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Hash password and compare
    let passwordHash: string;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (hashError: any) {
      console.error('Password hashing error:', hashError);
      return new Response(
        JSON.stringify({ error: '비밀번호 처리 중 오류가 발생했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    if (passwordHash !== user.password_hash) {
      return new Response(
        JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate simple token (base64 encoded user info)
    let token: string;
    try {
      const tokenData = {
        userId: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      };
      token = btoa(JSON.stringify(tokenData));
    } catch (tokenError: any) {
      console.error('Token generation error:', tokenError);
      return new Response(
        JSON.stringify({ error: '토큰 생성 중 오류가 발생했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        message: '로그인 성공',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ 
        error: '로그인에 실패했습니다.',
        details: error.message || 'Unknown error',
        type: error.name || 'Error'
      }),
      { 
        status: 500, 
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
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
