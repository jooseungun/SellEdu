// R2에서 이미지 제공 API
// 경로: /api/v1/images/{path}
// 예: /api/v1/images/thumbnails/1234567890_abc123.jpg

import { R2Bucket } from '@cloudflare/workers-types';

export async function onRequestGet({ params, env }: {
  params: { path: string };
  env: {
    IMAGES: R2Bucket;
  };
}): Promise<Response> {
  try {
    const imagePath = params.path;
    
    if (!imagePath) {
      return new Response('Image path is required', { status: 400 });
    }

    console.log('R2 Image fetch - Requesting:', imagePath);

    // R2에서 이미지 가져오기
    const object = await env.IMAGES.get(imagePath);

    if (!object) {
      return new Response('Image not found', { status: 404 });
    }

    // 이미지 데이터 가져오기
    const imageData = await object.arrayBuffer();

    // Content-Type 결정
    const contentType = object.httpMetadata?.contentType || 
                       object.customMetadata?.contentType || 
                       'image/jpeg';

    console.log('R2 Image fetch - Success:', { imagePath, contentType, size: imageData.byteLength });

    return new Response(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': object.httpMetadata?.cacheControl || 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error: any) {
    console.error('R2 Image fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

