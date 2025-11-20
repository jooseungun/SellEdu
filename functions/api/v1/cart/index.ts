import { D1Database } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

// 장바구니 조회 API

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
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 장바구니 조회 (콘텐츠 정보 포함)
    const cartItems = await env.DB.prepare(
      `SELECT 
        c.id,
        c.content_id,
        c.quantity,
        c.created_at,
        ct.id as content_id_full,
        ct.title,
        ct.description,
        ct.thumbnail_url,
        ct.price,
        ct.category,
        ct.seller_id,
        u.username as seller_username
      FROM cart c
      INNER JOIN contents ct ON c.content_id = ct.id
      LEFT JOIN users u ON ct.seller_id = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC`
    )
      .bind(tokenData.userId)
      .all<{
        id: number;
        content_id: number;
        quantity: number;
        created_at: string;
        content_id_full: number;
        title: string;
        description: string;
        thumbnail_url: string | null;
        price: number;
        category: string;
        seller_id: number;
        seller_username: string;
      }>();

    const items = cartItems.results || [];

    // 총 금액 계산
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return new Response(
      JSON.stringify({
        items: items.map(item => ({
          id: item.id,
          contentId: item.content_id,
          quantity: item.quantity,
          createdAt: item.created_at,
          content: {
            id: item.content_id_full,
            title: item.title,
            description: item.description,
            thumbnailUrl: item.thumbnail_url,
            price: item.price,
            category: item.category,
            sellerId: item.seller_id,
            sellerUsername: item.seller_username
          }
        })),
        totalAmount,
        itemCount: items.length
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Cart get error:', error);
    return new Response(
      JSON.stringify({
        error: '장바구니 조회 중 오류가 발생했습니다.',
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

