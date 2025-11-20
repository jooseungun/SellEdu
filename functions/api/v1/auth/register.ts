// Cloudflare Pages Function for user registration

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
    if (!env || !env.DB) {
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 연결에 실패했습니다.',
          details: 'D1 바인딩이 설정되지 않았습니다. Cloudflare Pages 대시보드에서 D1 바인딩을 확인해주세요.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { username, email, password, name, mobile, role = 'buyer' } = body;

    // 필수 필드 검증
    if (!username || !email || !password || !name) {
      return new Response(
        JSON.stringify({ error: '필수 필드가 누락되었습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: '유효한 이메일 형식이 아닙니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 데이터베이스 테이블 확인 및 생성
    let tableExists = false;
    try {
      const tableCheck = await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      ).first();
      tableExists = !!tableCheck;
      
      if (!tableExists) {
        console.log('users table does not exist, attempting to create...');
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
              details: createError.message
            }),
            { status: 500, headers: corsHeaders }
          );
        }
      }
    } catch (checkError: any) {
      console.error('Error checking table:', checkError);
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 확인 중 오류가 발생했습니다.',
          details: checkError.message
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 중복 사용자 확인
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    )
      .bind(username, email)
      .first<{ id: number }>();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: '이미 사용 중인 아이디 또는 이메일입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 비밀번호 해시 생성 (간단한 SHA-256 해시)
    // 실제 운영 환경에서는 bcrypt 등을 사용하는 것이 좋습니다
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 사용자 생성
    const result = await env.DB.prepare(
      `INSERT INTO users (username, email, password_hash, name, mobile, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(username, email, passwordHash, name, mobile || null, role)
      .run();

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: '회원가입에 실패했습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 구매자/판매자 테이블 생성
    if (role === 'buyer') {
      try {
        // buyers 테이블 확인 및 생성
        const buyerTableCheck = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='buyers'"
        ).first();

        if (!buyerTableCheck) {
          await env.DB.exec(`
            CREATE TABLE IF NOT EXISTS buyers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              grade TEXT DEFAULT 'BRONZE',
              discount_rate REAL DEFAULT 0.00,
              total_purchase_amount REAL DEFAULT 0.00,
              recent_purchase_amount REAL DEFAULT 0.00,
              recent_months INTEGER DEFAULT 3,
              last_grade_update TEXT,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_buyer_user_id ON buyers(user_id);
          `);
        }

        // 구매자 레코드 생성
        const userId = result.meta.last_row_id;
        await env.DB.prepare(
          `INSERT INTO buyers (user_id, grade, discount_rate, total_purchase_amount, recent_purchase_amount)
           VALUES (?, 'BRONZE', 0.00, 0.00, 0.00)`
        )
          .bind(userId)
          .run();
      } catch (buyerError: any) {
        console.error('Failed to create buyer record:', buyerError);
        // 구매자 레코드 생성 실패해도 회원가입은 성공으로 처리
      }
    } else if (role === 'seller') {
      try {
        // sellers 테이블 확인 및 생성
        const sellerTableCheck = await env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='sellers'"
        ).first();

        if (!sellerTableCheck) {
          await env.DB.exec(`
            CREATE TABLE IF NOT EXISTS sellers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              grade TEXT DEFAULT 'BRONZE',
              commission_rate REAL DEFAULT 10.00,
              total_sales_amount REAL DEFAULT 0.00,
              recent_sales_amount REAL DEFAULT 0.00,
              recent_months INTEGER DEFAULT 3,
              last_grade_update TEXT,
              bank_name TEXT,
              account_number TEXT,
              account_holder TEXT,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_seller_user_id ON sellers(user_id);
          `);
        }

        // 판매자 레코드 생성
        const userId = result.meta.last_row_id;
        await env.DB.prepare(
          `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount)
           VALUES (?, 'BRONZE', 10.00, 0.00, 0.00)`
        )
          .bind(userId)
          .run();
      } catch (sellerError: any) {
        console.error('Failed to create seller record:', sellerError);
        // 판매자 레코드 생성 실패해도 회원가입은 성공으로 처리
      }
    }

    return new Response(
      JSON.stringify({
        message: '회원가입이 완료되었습니다.',
        userId: result.meta.last_row_id
      }),
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: '회원가입 처리 중 오류가 발생했습니다.',
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

