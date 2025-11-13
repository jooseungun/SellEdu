// Cloudflare Pages Function for user login
// Note: jose library requires npm install in functions directory
// For now, using simple token generation

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    JWT_SECRET?: string;
  };
}): Promise<Response> {
  try {
    const body = await request.json();

    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ error: '아이디와 비밀번호를 입력해주세요.' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // Get user from database
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    )
      .bind(username)
      .first<{
        id: number;
        username: string;
        email: string;
        password_hash: string;
        name: string;
        role: string;
      }>();

    if (!user) {
      return new Response(
        JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // Hash password and compare
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (passwordHash !== user.password_hash) {
      return new Response(
        JSON.stringify({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      );
    }

    // Generate simple token (base64 encoded user info)
    // In production, use proper JWT library
    const tokenData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
    const token = btoa(JSON.stringify(tokenData));

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
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    );
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: '로그인에 실패했습니다.', details: error.message }),
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

