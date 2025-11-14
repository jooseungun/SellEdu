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
        console.error('users table does not exist, attempting to create...');
        // 테이블이 없으면 자동으로 생성 시도
        try {
          await env.DB.exec(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              name TEXT NOT NULL,
              birth_date TEXT,
              phone TEXT,
              mobile TEXT,
              role TEXT DEFAULT 'buyer' CHECK(role IN ('buyer', 'seller', 'admin')),
              created_at TEXT DEFAULT (datetime('now')),
              updated_at TEXT DEFAULT (datetime('now'))
            );
            CREATE INDEX IF NOT EXISTS idx_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_email ON users(email);
          `);
          console.log('users table created successfully');
          tableExists = true;
        } catch (createError: any) {
          console.error('Failed to create users table:', createError);
          return new Response(
            JSON.stringify({ 
              error: '데이터베이스 테이블 생성에 실패했습니다.',
              details: createError.message || 'Unknown error'
            }),
            { status: 500, headers: corsHeaders }
          );
        }
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
      
      // Base64 인코딩 - 표준 base64 사용 (Cloudflare Workers는 btoa를 지원하지 않을 수 있으므로 직접 구현)
      // 하지만 실제로는 표준 base64와 호환되도록 구현
      const base64Encode = (str: string): string => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        
        while (i < bytes.length) {
          const a = bytes[i++];
          const b = i < bytes.length ? bytes[i++] : 0;
          const c = i < bytes.length ? bytes[i++] : 0;
          
          const bitmap = (a << 16) | (b << 8) | c;
          
          result += base64Chars.charAt((bitmap >> 18) & 63);
          result += base64Chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < bytes.length ? base64Chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < bytes.length ? base64Chars.charAt(bitmap & 63) : '=';
        }
        
        return result;
      };
      
      const tokenString = JSON.stringify(tokenData);
      token = base64Encode(tokenString);
      console.log('Token data:', tokenData);
      console.log('Token string length:', tokenString.length);
    } catch (tokenError: any) {
      console.error('Token generation error:', tokenError);
      console.error('Token error details:', {
        message: tokenError.message,
        stack: tokenError.stack,
        name: tokenError.name
      });
      return new Response(
        JSON.stringify({ 
          error: '토큰 생성 중 오류가 발생했습니다.',
          details: tokenError.message || 'Unknown token error'
        }),
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
