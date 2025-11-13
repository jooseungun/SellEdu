// Cloudflare Pages Function for user registration

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    JWT_SECRET?: string;
  };
}): Promise<Response> {
  try {
    const body = await request.json();

    // Validation
    const { username, email, password, name, phone, mobile, role } = body;

    if (!username || !email || !password || !name) {
      return new Response(
        JSON.stringify({ error: '필수 필드가 누락되었습니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: '비밀번호는 최소 6자 이상이어야 합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: '유효한 이메일 형식이 아닙니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    )
      .bind(username, email)
      .first();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: '이미 사용 중인 아이디 또는 이메일입니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insert user
    const userRole = role || 'buyer';
    const result = await env.DB.prepare(
      `INSERT INTO users (username, email, password_hash, name, phone, mobile, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    )
      .bind(username, email, passwordHash, name, phone || null, mobile || null, userRole)
      .run();

    const userId = result.meta.last_row_id;

    // Create buyer/seller records (admin 제외)
    if (userRole !== 'admin') {
      // Create buyer record
      await env.DB.prepare(
        `INSERT INTO buyers (user_id, grade, discount_rate, total_purchase_amount, recent_purchase_amount, recent_months)
         VALUES (?, 'BRONZE', 0.00, 0.00, 0.00, 3)`
      )
        .bind(userId)
        .run();

      // Create seller record if role is seller
      if (userRole === 'seller') {
        await env.DB.prepare(
          `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount, recent_months)
           VALUES (?, 'BRONZE', 10.00, 0.00, 0.00, 3)`
        )
          .bind(userId)
          .run();
      }
    }

    return new Response(
      JSON.stringify({
        message: '회원가입이 완료되었습니다.',
        user: {
          id: userId,
          username,
          email,
          name,
          role: userRole
        }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: '회원가입에 실패했습니다.', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

