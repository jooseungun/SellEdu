import { D1Database } from '@cloudflare/workers-types';

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
    // Authorization 헤더에서 토큰 읽기
    const authHeader = request.headers.get('Authorization');
    console.log('Seller list - Authorization header:', authHeader ? 'exists' : 'missing');
    console.log('Seller list - All headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
    
    let sellerId: number | null = null;
    
    if (!authHeader) {
      console.log('Seller list - No authorization header found');
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Seller list - Invalid authorization header format:', authHeader.substring(0, 20));
      return new Response(
        JSON.stringify({ error: '인증 헤더 형식이 올바르지 않습니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
    try {
      const token = authHeader.substring(7);
      console.log('Seller list - Token received, length:', token.length);
      console.log('Seller list - Token first 50 chars:', token.substring(0, 50));
      
      // Base64 디코딩 (Cloudflare Workers에서 atob가 없을 수 있으므로 직접 구현)
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const base64Map: { [key: string]: number } = {};
      for (let i = 0; i < base64Chars.length; i++) {
        base64Map[base64Chars[i]] = i;
      }
      base64Map['='] = 0;
      
      // 토큰 정리 (불필요한 문자 제거)
      let cleanedToken = token.replace(/[^A-Za-z0-9+/=]/g, '');
      console.log('Seller list - Cleaned token length:', cleanedToken.length);
      
      // 패딩 복원 (base64는 4의 배수여야 함)
      const padding = (4 - (cleanedToken.length % 4)) % 4;
      cleanedToken = cleanedToken + '='.repeat(padding);
      console.log('Seller list - Padded token length:', cleanedToken.length);
      
      // Base64 디코딩
      let binaryString = '';
      for (let i = 0; i < cleanedToken.length; i += 4) {
        const enc1 = base64Map[cleanedToken[i]] || 0;
        const enc2 = base64Map[cleanedToken[i + 1] || '='] || 0;
        const enc3 = base64Map[cleanedToken[i + 2] || '='] || 0;
        const enc4 = base64Map[cleanedToken[i + 3] || '='] || 0;
        
        const bitmap = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
        
        if (cleanedToken[i + 2] && cleanedToken[i + 2] !== '=') {
          binaryString += String.fromCharCode((bitmap >> 16) & 255);
        }
        if (cleanedToken[i + 3] && cleanedToken[i + 3] !== '=') {
          binaryString += String.fromCharCode((bitmap >> 8) & 255);
          binaryString += String.fromCharCode(bitmap & 255);
        } else if (cleanedToken[i + 2] && cleanedToken[i + 2] !== '=') {
          binaryString += String.fromCharCode((bitmap >> 8) & 255);
        }
      }
      
      console.log('Seller list - Binary string length:', binaryString.length);
      
      // UTF-8 디코딩을 위해 Uint8Array로 변환
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // TextDecoder를 사용하여 UTF-8 디코딩
      const decoder = new TextDecoder('utf-8');
      const decodedString = decoder.decode(bytes);
      console.log('Seller list - Decoded string length:', decodedString.length);
      console.log('Seller list - Decoded string first 100 chars:', decodedString.substring(0, 100));
      
      const tokenData = JSON.parse(decodedString);
      sellerId = tokenData.userId || null;
      console.log('Seller list - Decoded token - userId:', sellerId, 'username:', tokenData.username, 'role:', tokenData.role);
      
      // sellerId가 없으면 에러 반환
      if (!sellerId) {
        console.error('Seller list - userId not found in token:', tokenData);
        return new Response(
          JSON.stringify({ error: '사용자 ID를 찾을 수 없습니다. 다시 로그인해주세요.' }),
          { status: 401, headers: corsHeaders }
        );
      }
    } catch (e: any) {
      console.error('Seller list - Token parsing error:', e);
      console.error('Seller list - Error message:', e.message);
      console.error('Seller list - Error stack:', e.stack);
      console.error('Seller list - Token value (first 50):', authHeader.substring(7).substring(0, 50));
      return new Response(
        JSON.stringify({ error: '토큰 파싱에 실패했습니다. 다시 로그인해주세요.', details: e.message || 'Unknown error' }),
        { status: 401, headers: corsHeaders }
      );
    }
    
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

    return new Response(
      JSON.stringify(result.results || []),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get seller contents error:', error);
    return new Response(
      JSON.stringify({ error: '판매자 콘텐츠 조회에 실패했습니다.', details: error.message }),
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

