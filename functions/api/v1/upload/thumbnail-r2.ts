// R2를 사용한 썸네일 업로드 API

import { R2Bucket } from '@cloudflare/workers-types';
import { getTokenFromRequest } from '../utils/token';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    IMAGES: R2Bucket;
  };
}): Promise<Response> {
  try {
    // 인증 확인
    const tokenData = getTokenFromRequest(request);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: '로그인이 필요합니다.' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Content-Type 확인
    const contentType = request.headers.get('Content-Type') || '';
    console.log('R2 Thumbnail upload - Content-Type:', contentType);
    
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
    console.log('R2 Thumbnail upload - File received:', file ? { name: file.name, size: file.size, type: file.type } : 'null');

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

    // 파일 확장자 추출
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(fileExtension)) {
      return new Response(
        JSON.stringify({ error: '지원하지 않는 이미지 형식입니다. (jpg, jpeg, png, gif, webp만 가능)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 고유 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileName = `thumbnails/${timestamp}_${randomStr}.${fileExtension}`;

    console.log('R2 Thumbnail upload - Uploading to R2:', fileName);

    // R2에 파일 업로드
    try {
      const fileArrayBuffer = await file.arrayBuffer();
      await env.IMAGES.put(fileName, fileArrayBuffer, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000'
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: tokenData.userId.toString(),
          uploadedAt: new Date().toISOString()
        }
      });

      console.log('R2 Thumbnail upload - Successfully uploaded to R2:', fileName);
    } catch (error: any) {
      console.error('R2 Thumbnail upload - R2 upload error:', error);
      return new Response(
        JSON.stringify({ 
          error: '파일 업로드에 실패했습니다.', 
          details: error.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // R2 Public URL 생성 (Cloudflare Pages에서 R2를 public으로 설정한 경우)
    // 또는 R2의 public URL을 사용
    // 실제 배포 환경에서는 R2 버킷을 public으로 설정하거나, 
    // Cloudflare Workers를 통해 이미지를 제공해야 합니다.
    
    // Workers를 통한 제공 (권장)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    // 경로의 /를 인코딩하여 단일 파라미터로 전달
    const encodedPath = encodeURIComponent(fileName);
    const thumbnailUrl = `${baseUrl}/api/v1/images/${encodedPath}`;

    console.log('R2 Thumbnail upload - Success:', { fileName, thumbnailUrl });

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
    console.error('R2 Thumbnail upload error:', error);
    return new Response(
      JSON.stringify({ 
        error: '썸네일 업로드에 실패했습니다.', 
        details: error.message || '알 수 없는 오류가 발생했습니다.'
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

