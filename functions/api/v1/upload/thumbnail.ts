import { D1Database } from '@cloudflare/workers-types';

// 프로토타입: 실제 파일 저장은 나중에 구현
// 현재는 파일 정보만 반환
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: '파일이 없습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: '파일 크기는 5MB를 초과할 수 없습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 파일 타입 확인 (이미지만)
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: '이미지 파일만 업로드할 수 있습니다.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 파일을 base64로 변환하여 data URL 생성
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Base64 인코딩
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let base64 = '';
    let i = 0;
    
    while (i < uint8Array.length) {
      const byte1 = uint8Array[i++];
      const byte2 = i < uint8Array.length ? uint8Array[i++] : undefined;
      const byte3 = i < uint8Array.length ? uint8Array[i++] : undefined;
      
      const bitmap = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);
      
      base64 += base64Chars.charAt((bitmap >> 18) & 63);
      base64 += base64Chars.charAt((bitmap >> 12) & 63);
      
      if (byte2 !== undefined) {
        base64 += base64Chars.charAt((bitmap >> 6) & 63);
      } else {
        base64 += '=';
      }
      
      if (byte3 !== undefined) {
        base64 += base64Chars.charAt(bitmap & 63);
      } else {
        base64 += '=';
      }
    }
    
    // Data URL 생성
    const thumbnailUrl = `data:${file.type};base64,${base64}`;

    return new Response(
      JSON.stringify({
        message: '썸네일 업로드 완료',
        thumbnail_url: thumbnailUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Thumbnail upload error:', error);
    return new Response(
      JSON.stringify({ error: '썸네일 업로드에 실패했습니다.', details: error.message }),
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

