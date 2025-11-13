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
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.status = 'approved'
    `;

    const params: any[] = [];

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

