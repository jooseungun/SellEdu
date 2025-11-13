// Cloudflare Pages Function for database initialization
// 이 함수는 D1 데이터베이스에 필요한 테이블을 생성합니다.

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
        JSON.stringify({ error: 'D1 데이터베이스 바인딩이 설정되지 않았습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // users 테이블 생성
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

    // buyers 테이블 생성
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
      CREATE INDEX IF NOT EXISTS idx_buyer_grade ON buyers(grade);
    `);

    // sellers 테이블 생성
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
      CREATE INDEX IF NOT EXISTS idx_seller_grade ON sellers(grade);
    `);

    // 관리자 계정 생성 (비밀번호: admin, SHA-256 해시)
    await env.DB.exec(`
      INSERT OR IGNORE INTO users (username, email, password_hash, name, role, created_at, updated_at)
      VALUES (
        'admin',
        'admin@selledu.com',
        '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        '관리자',
        'admin',
        datetime('now'),
        datetime('now')
      );
    `);

    // 테이블 생성 확인
    const tables = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();

    return new Response(
      JSON.stringify({
        message: '데이터베이스 초기화가 완료되었습니다.',
        tables: tables.results?.map((t: any) => t.name) || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return new Response(
      JSON.stringify({
        error: '데이터베이스 초기화 중 오류가 발생했습니다.',
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

