import { D1Database } from '@cloudflare/workers-types';

// 썸네일 이미지 조회 API
export async function onRequestGet({ params, env }: {
  params: { id: string };
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  try {
    const thumbnailId = params.id;

    if (!thumbnailId) {
      return new Response('Thumbnail ID is required', { status: 400 });
    }

    // DB에서 썸네일 조회
    const result = await env.DB.prepare(
      'SELECT file_type, file_data FROM thumbnails WHERE id = ?'
    ).bind(thumbnailId).first<{ file_type: string; file_data: string }>();

    if (!result) {
      return new Response('Thumbnail not found', { status: 404 });
    }

    // Base64 디코딩하여 이미지 반환
    const imageData = result.file_data;
    
    // Base64 디코딩 (Cloudflare Workers에서 atob가 없을 수 있으므로 직접 구현)
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64Map: { [key: string]: number } = {};
    for (let i = 0; i < base64Chars.length; i++) {
      base64Map[base64Chars[i]] = i;
    }
    base64Map['='] = 0;
    
    let binaryString = '';
    for (let i = 0; i < imageData.length; i += 4) {
      const enc1 = base64Map[imageData[i]] || 0;
      const enc2 = base64Map[imageData[i + 1]] || 0;
      const enc3 = base64Map[imageData[i + 2]] || 0;
      const enc4 = base64Map[imageData[i + 3]] || 0;
      
      const bitmap = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
      
      if (imageData[i + 2] !== '=') {
        binaryString += String.fromCharCode((bitmap >> 16) & 255);
      }
      if (imageData[i + 3] !== '=') {
        binaryString += String.fromCharCode((bitmap >> 8) & 255);
        binaryString += String.fromCharCode(bitmap & 255);
      }
    }
    
    const imageBuffer = Uint8Array.from(binaryString, c => c.charCodeAt(0));

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': result.file_type,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('Thumbnail fetch error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

