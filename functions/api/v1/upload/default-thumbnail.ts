// 기본 썸네일을 R2에 업로드하는 엔드포인트
// 한 번만 실행하면 됩니다 (관리자용)

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    IMAGES?: R2Bucket;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!env.IMAGES) {
    return new Response(
      JSON.stringify({ error: 'R2 버킷이 설정되지 않았습니다.' }),
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    // 기본 썸네일 SVG 내용
    const defaultThumbnailSvg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#grad1)"/>
  <text x="200" y="140" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">SellEdu</text>
  <text x="200" y="180" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" opacity="0.8">교육 콘텐츠</text>
  <circle cx="200" cy="80" r="30" fill="white" opacity="0.3"/>
  <path d="M 190 80 L 200 90 L 210 80" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    const fileName = 'default-thumbnail.svg';
    const fileArrayBuffer = new TextEncoder().encode(defaultThumbnailSvg);

    // R2에 업로드
    await env.IMAGES.put(fileName, fileArrayBuffer, {
      httpMetadata: {
        contentType: 'image/svg+xml',
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        isDefault: 'true'
      }
    });

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const encodedPath = encodeURIComponent(fileName);
    const thumbnailUrl = `${baseUrl}/api/v1/images/${encodedPath}`;

    return new Response(
      JSON.stringify({
        message: '기본 썸네일 업로드 완료',
        thumbnail_url: thumbnailUrl,
        file_name: fileName
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('기본 썸네일 업로드 오류:', error);
    return new Response(
      JSON.stringify({ error: '기본 썸네일 업로드에 실패했습니다.', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

