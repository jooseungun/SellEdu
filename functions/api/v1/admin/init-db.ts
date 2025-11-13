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

    // 각 SQL 문을 개별적으로 실행
    const statements = [
      // users 테이블 생성
      `CREATE TABLE IF NOT EXISTS users (
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
      )`,
      `CREATE INDEX IF NOT EXISTS idx_username ON users(username)`,
      `CREATE INDEX IF NOT EXISTS idx_email ON users(email)`,
      
      // buyers 테이블 생성
      `CREATE TABLE IF NOT EXISTS buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        grade TEXT DEFAULT 'BRONZE',
        discount_rate REAL DEFAULT 0.00,
        total_purchase_amount REAL DEFAULT 0.00,
        recent_purchase_amount REAL DEFAULT 0.00,
        recent_months INTEGER DEFAULT 3,
        last_grade_update TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_buyer_user_id ON buyers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_buyer_grade ON buyers(grade)`,
      
      // sellers 테이블 생성
      `CREATE TABLE IF NOT EXISTS sellers (
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
      )`,
      `CREATE INDEX IF NOT EXISTS idx_seller_user_id ON sellers(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_seller_grade ON sellers(grade)`,
      
      // 콘텐츠 테이블 생성 (기획서 참고)
      `CREATE TABLE IF NOT EXISTS contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        detailed_description TEXT,
        thumbnail_url TEXT,
        cdn_link TEXT,
        content_hash TEXT,
        price REAL DEFAULT 0.00,
        category TEXT NOT NULL,
        grade TEXT DEFAULT '베이직' CHECK(grade IN ('베이직', '프리미엄', '스탠다드', '개별구매')),
        age_rating TEXT DEFAULT 'All' CHECK(age_rating IN ('All', '15', '18')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
        display_order INTEGER DEFAULT 0,
        content_area TEXT DEFAULT 'default',
        purchase_count INTEGER DEFAULT 0,
        avg_rating REAL DEFAULT 0.00,
        review_count INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        education_period INTEGER DEFAULT 0,
        tags TEXT,
        sale_start_date TEXT,
        sale_end_date TEXT,
        is_always_on_sale INTEGER DEFAULT 0 CHECK(is_always_on_sale IN (0, 1)),
        preview_duration INTEGER DEFAULT 600,
        rejection_reason TEXT,
        is_reapply INTEGER DEFAULT 0 CHECK(is_reapply IN (0, 1)),
        rejected_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        approved_at TEXT,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_content_seller_id ON contents(seller_id)`,
      `CREATE INDEX IF NOT EXISTS idx_content_category ON contents(category)`,
      `CREATE INDEX IF NOT EXISTS idx_content_status ON contents(status)`,
      `CREATE INDEX IF NOT EXISTS idx_content_display_order ON contents(display_order)`,
      `CREATE INDEX IF NOT EXISTS idx_content_content_hash ON contents(content_hash)`,
      `CREATE INDEX IF NOT EXISTS idx_content_content_area ON contents(content_area)`,
      
      // 콘텐츠 강의 차시 테이블 생성
      `CREATE TABLE IF NOT EXISTS content_lessons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER NOT NULL,
        lesson_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cdn_link TEXT,
        duration INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_lesson_content_id ON content_lessons(content_id)`,
      `CREATE INDEX IF NOT EXISTS idx_lesson_display_order ON content_lessons(display_order)`,
      
      // 등급 정책 테이블 생성
      `CREATE TABLE IF NOT EXISTS grade_policies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_type TEXT NOT NULL CHECK(user_type IN ('buyer', 'seller')),
        grade_name TEXT NOT NULL,
        min_amount REAL NOT NULL,
        max_amount REAL,
        discount_rate REAL DEFAULT 0.00,
        commission_rate REAL DEFAULT 10.00,
        period_type TEXT DEFAULT 'recent' CHECK(period_type IN ('total', 'recent')),
        period_months INTEGER DEFAULT 3,
        is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_type, grade_name)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_grade_policy_user_type ON grade_policies(user_type)`,
      
      // 리뷰 테이블 생성
      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_content_id ON reviews(content_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`,
      
      // 정산 내역 테이블 생성
      `CREATE TABLE IF NOT EXISTS settlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        content_id INTEGER,
        purchase_id INTEGER,
        amount REAL NOT NULL,
        commission_rate REAL NOT NULL,
        commission_amount REAL NOT NULL,
        settlement_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'requested', 'completed', 'cancelled')),
        settlement_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
      )`,
      `CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON settlements(seller_id)`,
      `CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status)`,
      
      // 관리자 계정 생성 (비밀번호: admin, SHA-256 해시)
      `INSERT OR IGNORE INTO users (username, email, password_hash, name, role, created_at, updated_at)
       VALUES (
         'admin',
         'admin@selledu.com',
         '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
         '관리자',
         'admin',
         datetime('now'),
         datetime('now')
       )`
    ];

    // 각 SQL 문을 순차적으로 실행
    for (const sql of statements) {
      try {
        await env.DB.prepare(sql).run();
      } catch (stmtError: any) {
        // 테이블이 이미 존재하는 경우 무시
        if (!stmtError.message?.includes('already exists') && 
            !stmtError.message?.includes('duplicate')) {
          console.error('SQL execution error:', sql, stmtError);
          throw stmtError;
        }
      }
    }

    // 테이블 생성 확인
    const tablesResult = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).all();

    const tables = tablesResult.results?.map((t: any) => t.name) || [];

    return new Response(
      JSON.stringify({
        message: '데이터베이스 초기화가 완료되었습니다.',
        tables: tables
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Database initialization error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({
        error: '데이터베이스 초기화 중 오류가 발생했습니다.',
        details: error.message || 'Unknown error',
        type: error.name || 'Error'
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
