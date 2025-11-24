import { D1Database, R2Bucket } from '@cloudflare/workers-types';

// 썸네일 파일을 R2에 저장하고 URL 반환
export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
    IMAGES?: R2Bucket;
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

    // File 객체 검증
    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 파일 형식입니다.' }),
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

    // R2에 저장 (R2가 없으면 에러 반환)
    if (!env.IMAGES) {
      return new Response(
        JSON.stringify({ error: 'R2 버킷이 설정되지 않았습니다. 관리자에게 문의하세요.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // R2에 저장
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    if (!allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: '지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp, svg만 가능)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `thumbnails/${timestamp}_${randomStr}.${fileExtension}`;

    try {
      console.log('Thumbnail upload - Starting R2 upload:', fileName);
      
      // File을 ArrayBuffer로 변환
      const fileArrayBuffer = await file.arrayBuffer();
      console.log('Thumbnail upload - File converted to ArrayBuffer, size:', fileArrayBuffer.byteLength);

      // R2에 업로드
      await env.IMAGES.put(fileName, fileArrayBuffer, {
        httpMetadata: {
          contentType: file.type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          cacheControl: 'public, max-age=31536000'
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      console.log('Thumbnail upload - R2 upload successful:', fileName);

      // URL 생성
      const url = new URL(request.url);
      const baseUrl = `${url.protocol}//${url.host}`;
      const encodedPath = encodeURIComponent(fileName);
      const thumbnailUrl = `${baseUrl}/api/v1/images/${encodedPath}`;

      console.log('Thumbnail upload - URL generated:', thumbnailUrl);

      return new Response(
        JSON.stringify({
          message: '썸네일 업로드 완료',
          thumbnail_url: thumbnailUrl,
          file_name: fileName,
          original_name: file.name,
          file_size: file.size,
          file_type: file.type
        }),
        { status: 200, headers: corsHeaders }
      );
    } catch (error: any) {
      console.error('Thumbnail upload - R2 upload error:', error);
      console.error('Thumbnail upload - R2 upload error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return new Response(
        JSON.stringify({ 
          error: '파일 업로드에 실패했습니다.', 
          details: error.message || '알 수 없는 오류가 발생했습니다.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

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

