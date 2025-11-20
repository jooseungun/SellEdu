import { D1Database } from '@cloudflare/workers-types';

export async function onRequestPost({ params, env }: {
  params: { id: string };
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
    const requestId = params.id;

    // 제휴할인 신청 정보 조회
    const request = await env.DB.prepare(
      'SELECT user_id, type FROM partnership_requests WHERE id = ?'
    )
      .bind(requestId)
      .first<{ user_id: number; type: string }>();

    if (!request) {
      return new Response(
        JSON.stringify({ error: '제휴할인 신청을 찾을 수 없습니다.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // 제휴할인 신청 상태 업데이트
    await env.DB.prepare(
      `UPDATE partnership_requests 
       SET status = 'approved',
           updated_at = datetime('now')
       WHERE id = ?`
    )
      .bind(requestId)
      .run();

    // 제휴할인 타입에 따른 할인율 설정
    // type: '제휴사' 또는 '고객사'
    // 제휴사: 10% 할인, 고객사: 15% 할인 (예시)
    let discountRate = 0;
    if (request.type === '제휴사') {
      discountRate = 10.0;
    } else if (request.type === '고객사') {
      discountRate = 15.0;
    }

    // buyers 테이블의 discount_rate 업데이트
    if (discountRate > 0) {
      // buyers 레코드가 있는지 확인
      const buyerCheck = await env.DB.prepare(
        'SELECT id FROM buyers WHERE user_id = ?'
      )
        .bind(request.user_id)
        .first();

      if (buyerCheck) {
        // 기존 레코드 업데이트
        await env.DB.prepare(
          'UPDATE buyers SET discount_rate = ? WHERE user_id = ?'
        )
          .bind(discountRate, request.user_id)
          .run();
      } else {
        // 새 레코드 생성
        await env.DB.prepare(
          `INSERT INTO buyers (user_id, grade, discount_rate, total_purchase_amount, recent_purchase_amount)
           VALUES (?, 'BRONZE', ?, 0.00, 0.00)`
        )
          .bind(request.user_id, discountRate)
          .run();
      }
    }

    return new Response(
      JSON.stringify({ 
        message: '제휴할인 신청이 승인되었습니다.',
        discount_rate: discountRate
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Approve partnership error:', error);
    return new Response(
      JSON.stringify({ error: '승인 처리에 실패했습니다.', details: error.message }),
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

