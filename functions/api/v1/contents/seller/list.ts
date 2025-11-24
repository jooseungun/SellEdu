import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../../utils/token';

export async function onRequestGet({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  console.log('=== SELLER LIST API CALLED ===');
  console.log('Seller list - Request method:', request.method);
  console.log('Seller list - Request URL:', request.url);
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    // 데이터베이스 연결 확인
    if (!env || !env.DB) {
      console.error('Seller list - D1 Database binding is not available');
      return new Response(
        JSON.stringify({ 
          error: '데이터베이스 연결에 실패했습니다.',
          details: 'D1 바인딩이 설정되지 않았습니다.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    console.log('Seller list - Database connection OK');

    // 공통 토큰 디코딩 함수 사용
    console.log('Seller list - Attempting token decode...');
    
    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    console.log('Seller list - Authorization header present:', !!authHeader);
    if (authHeader) {
      console.log('Seller list - Authorization header length:', authHeader.length);
      console.log('Seller list - Authorization header starts with Bearer:', authHeader.startsWith('Bearer '));
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('Seller list - Token length:', token.length);
        console.log('Seller list - Token first 50 chars:', token.substring(0, 50));
      }
    }
    
    const tokenData = getTokenFromRequest(request);
    
    if (!tokenData) {
      console.log('Seller list - Token decode failed or missing');
      // 더 자세한 에러 정보 반환 (디버깅용)
      return new Response(
        JSON.stringify({ 
          error: '인증이 필요합니다. 다시 로그인해주세요.',
          details: authHeader ? '토큰 디코딩 실패' : 'Authorization 헤더 없음',
          debug: {
            hasAuthHeader: !!authHeader,
            authHeaderLength: authHeader?.length || 0,
            startsWithBearer: authHeader?.startsWith('Bearer ') || false
          }
        }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    const sellerId = tokenData.userId;
    console.log('Seller list - Authenticated user:', { userId: sellerId, username: tokenData.username, role: tokenData.role });
    
    if (!sellerId) {
      console.error('Seller list - userId not found in token');
      return new Response(
        JSON.stringify({ error: '사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    // 데이터베이스 쿼리 실행
    console.log('Seller list - Querying database for sellerId:', sellerId);
    const result = await env.DB.prepare(
      `SELECT
        c.id,
        c.seller_id,
        c.title,
        c.description,
        c.thumbnail_url,
        c.price,
        c.category,
        c.grade,
        c.age_rating,
        c.status,
        c.display_order,
        c.purchase_count,
        c.avg_rating,
        c.review_count,
        c.duration,
        c.rejection_reason,
        c.is_reapply,
        c.created_at,
        c.updated_at,
        u.username as seller_username
      FROM contents c
      LEFT JOIN users u ON c.seller_id = u.id
      WHERE c.seller_id = ?
      ORDER BY c.created_at DESC`
    )
      .bind(sellerId)
      .all();

    console.log('Seller list - Query executed successfully');
    console.log('Seller list - Results count:', result.results?.length || 0);

    // 각 콘텐츠별 실제 판매 금액 집계
    const contentsWithSales = await Promise.all(
      (result.results || []).map(async (content: any) => {
        // 해당 콘텐츠의 실제 판매 금액 집계 (paid 상태인 주문만)
        const salesResult = await env.DB.prepare(
          `SELECT COALESCE(SUM(final_amount), 0) as total_sales
           FROM orders
           WHERE content_id = ? AND status = 'paid'`
        )
          .bind(content.id)
          .first<{ total_sales: number }>();

        return {
          ...content,
          total_sales: salesResult?.total_sales || 0
        };
      })
    );

    return new Response(
      JSON.stringify(contentsWithSales),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Seller list - ERROR:', error);
    console.error('Seller list - Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    });
    return new Response(
      JSON.stringify({ 
        error: '판매자 콘텐츠 조회에 실패했습니다.', 
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

