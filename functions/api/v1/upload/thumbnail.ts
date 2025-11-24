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

    // R2가 있으면 R2에 저장, 없으면 기존 DB 방식 사용
    if (env.IMAGES) {
      // R2에 저장
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      if (!allowedExtensions.includes(fileExtension)) {
        return new Response(
          JSON.stringify({ error: '지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp만 가능)' }),
          { status: 400, headers: corsHeaders }
        );
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const fileName = `thumbnails/${timestamp}_${randomStr}.${fileExtension}`;

      try {
        const fileArrayBuffer = await file.arrayBuffer();
        await env.IMAGES.put(fileName, fileArrayBuffer, {
          httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000'
          },
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        });

        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        // 경로의 /를 인코딩하여 단일 파라미터로 전달
        const encodedPath = encodeURIComponent(fileName);
        const thumbnailUrl = `${baseUrl}/api/v1/images/${encodedPath}`;

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
        console.error('R2 upload error:', error);
        return new Response(
          JSON.stringify({ error: '파일 업로드에 실패했습니다.', details: error.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // 기존 DB 방식 (R2가 없는 경우 fallback)
    // 파일을 base64로 변환
    console.log('Thumbnail upload - Starting file conversion, size:', file.size);
    let base64: string;
    
    try {
      // Cloudflare Workers에서 File 객체를 안전하게 처리
      // file.arrayBuffer() 대신 stream을 사용하여 처리
      const reader = file.stream().getReader();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          totalLength += value.length;
        }
      }
      
      console.log('Thumbnail upload - File chunks read, total length:', totalLength);
      
      // 모든 청크를 하나의 Uint8Array로 합치기
      const combinedArray = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }
      
      console.log('Thumbnail upload - Combined array created, length:', combinedArray.length);
      
      // Base64 인코딩 (효율적인 방식)
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const base64Parts: string[] = [];
      let i = 0;
      const arrayLength = combinedArray.length;
      
      // 청크 단위로 Base64 인코딩하여 메모리 효율성 향상
      while (i < arrayLength) {
        const byte1 = combinedArray[i++];
        const byte2 = i < arrayLength ? combinedArray[i++] : undefined;
        const byte3 = i < arrayLength ? combinedArray[i++] : undefined;
        
        const bitmap = (byte1 << 16) | ((byte2 ?? 0) << 8) | (byte3 ?? 0);
        
        base64Parts.push(
          base64Chars.charAt((bitmap >> 18) & 63) +
          base64Chars.charAt((bitmap >> 12) & 63) +
          (byte2 !== undefined ? base64Chars.charAt((bitmap >> 6) & 63) : '=') +
          (byte3 !== undefined ? base64Chars.charAt(bitmap & 63) : '=')
        );
      }
      
      base64 = base64Parts.join('');
      console.log('Thumbnail upload - Base64 encoding completed, length:', base64.length);
      
    } catch (error: any) {
      console.error('Thumbnail upload - File conversion error:', error);
      console.error('Thumbnail upload - Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return new Response(
        JSON.stringify({ error: '파일 변환에 실패했습니다.', details: error.message }),
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

