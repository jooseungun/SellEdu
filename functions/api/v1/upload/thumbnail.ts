import { D1Database } from '@cloudflare/workers-types';

// 썸네일 파일을 DB에 저장하고 URL 반환
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
    // thumbnails 테이블이 없으면 생성
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS thumbnails (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_data TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_thumbnails_created_at ON thumbnails(created_at);
    `);

    // Content-Type 확인
    const contentType = request.headers.get('Content-Type') || '';
    console.log('Thumbnail upload - Content-Type:', contentType);
    
    // FormData 파싱
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error: any) {
      console.error('FormData parsing error:', error);
      return new Response(
        JSON.stringify({ error: '파일 형식이 올바르지 않습니다.', details: error.message }),
        { status: 400, headers: corsHeaders }
      );
    }
    
    const file = formData.get('file') as File;
    console.log('Thumbnail upload - File received:', file ? { name: file.name, size: file.size, type: file.type } : 'null');

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

    // 파일을 base64로 변환
    console.log('Thumbnail upload - Starting file conversion, size:', file.size);
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
      console.log('Thumbnail upload - ArrayBuffer created, length:', arrayBuffer.byteLength);
    } catch (error: any) {
      console.error('Thumbnail upload - ArrayBuffer error:', error);
      return new Response(
        JSON.stringify({ error: '파일 읽기에 실패했습니다.', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    const uint8Array = new Uint8Array(arrayBuffer);
    console.log('Thumbnail upload - Uint8Array created, length:', uint8Array.length);
    
    // Base64 인코딩 (Cloudflare Workers 호환 방식)
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let base64 = '';
    let i = 0;
    const totalLength = uint8Array.length;
    
    try {
      while (i < totalLength) {
        const byte1 = uint8Array[i++];
        const byte2 = i < totalLength ? uint8Array[i++] : undefined;
        const byte3 = i < totalLength ? uint8Array[i++] : undefined;
        
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
      console.log('Thumbnail upload - Base64 encoding completed, length:', base64.length);
    } catch (error: any) {
      console.error('Thumbnail upload - Base64 encoding error:', error);
      return new Response(
        JSON.stringify({ error: '파일 인코딩에 실패했습니다.', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 고유 ID 생성
    const thumbnailId = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    console.log('Thumbnail upload - Thumbnail ID generated:', thumbnailId);
    
    // DB에 저장
    try {
      console.log('Thumbnail upload - Starting DB insert');
      const dbResult = await env.DB.prepare(
        'INSERT INTO thumbnails (id, file_name, file_type, file_data) VALUES (?, ?, ?, ?)'
      ).bind(thumbnailId, file.name, file.type, base64).run();
      console.log('Thumbnail upload - DB insert successful:', dbResult);
    } catch (error: any) {
      console.error('Thumbnail upload - DB insert error:', error);
      console.error('Thumbnail upload - DB insert error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return new Response(
        JSON.stringify({ error: '데이터베이스 저장에 실패했습니다.', details: error.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 썸네일 조회 URL 반환 (절대 경로로 변환)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const thumbnailUrl = `${baseUrl}/api/v1/upload/thumbnail/${thumbnailId}`;

    console.log('Thumbnail upload - Success:', { thumbnailId, thumbnailUrl });

    return new Response(
      JSON.stringify({
        message: '썸네일 업로드 완료',
        thumbnail_url: thumbnailUrl,
        thumbnail_id: thumbnailId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Thumbnail upload error:', error);
    console.error('Thumbnail upload error stack:', error.stack);
    console.error('Thumbnail upload error name:', error.name);
    console.error('Thumbnail upload error message:', error.message);
    return new Response(
      JSON.stringify({ 
        error: '썸네일 업로드에 실패했습니다.', 
        details: error.message || '알 수 없는 오류가 발생했습니다.',
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

