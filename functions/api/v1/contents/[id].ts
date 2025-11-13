// Cloudflare Pages Function for content detail

export async function onRequestGet({ request, env, params }: {
  request: Request;
  env: {
    DB: D1Database;
  };
  params: {
    id: string;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    const contentId = parseInt(params.id);
    if (isNaN(contentId)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 콘텐츠 ID입니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 콘텐츠 정보 조회
    const content = await env.DB.prepare(
      `SELECT 
        c.*,
        u.username as seller_username,
        u.name as seller_name
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.id = ?`
    )
      .bind(contentId)
      .first();

    if (!content) {
      return new Response(
        JSON.stringify({ error: '콘텐츠를 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 강의 차시 조회
    const lessons = await env.DB.prepare(
      `SELECT * FROM content_lessons 
       WHERE content_id = ? 
       ORDER BY display_order ASC, lesson_number ASC`
    )
      .bind(contentId)
      .all();

    return new Response(
      JSON.stringify({
        ...content,
        lessons: lessons.results || []
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get content detail error:', error);
    return new Response(
      JSON.stringify({ 
        error: '콘텐츠 조회에 실패했습니다.',
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

