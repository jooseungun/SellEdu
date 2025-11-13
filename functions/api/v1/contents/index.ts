// Cloudflare Pages Function for contents list

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
      "SELECT name FROM sqlite_master WHERE type='table' AND name='contents'"
    ).first();

    if (!tableCheck) {
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 테이블이 없습니다.',
          contents: [],
          details: 'contents 테이블이 존재하지 않습니다. 데이터베이스를 초기화해주세요.',
          needsInit: true
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || '';

    let query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.price,
        c.category,
        c.grade,
        c.age_rating,
        c.purchase_count,
        c.avg_rating,
        c.review_count,
        c.duration,
        c.status,
        c.sale_start_date,
        c.sale_end_date,
        c.is_always_on_sale,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.status = 'approved'
    `;

    const params: any[] = [];
    const now = new Date().toISOString();

    // 판매 기간 필터링
    query += ` AND (
      c.is_always_on_sale = 1 OR
      (c.sale_start_date IS NULL OR c.sale_start_date <= ?) AND
      (c.sale_end_date IS NULL OR c.sale_end_date >= ?)
    )`;
    params.push(now, now);

    if (search) {
      query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category && category !== '전체') {
      query += ' AND c.category = ?';
      params.push(category);
    }

    query += ' ORDER BY c.display_order ASC, c.created_at DESC';

    const result = await env.DB.prepare(query)
      .bind(...params)
      .all();

    return new Response(
      JSON.stringify({
        contents: result.results || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get contents error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 목록 조회에 실패했습니다.',
        contents: []
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

