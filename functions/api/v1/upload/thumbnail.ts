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

    // 썸네일 URL 입력만 받음 (실제 파일 저장은 나중에 구현)
    // 현재는 URL을 직접 입력하거나, 외부 스토리지 서비스 URL을 사용
    // TODO: Cloudflare R2나 다른 스토리지에 실제 파일 저장 구현
    
    // 파일 정보만 반환하고, 실제 URL은 클라이언트에서 입력받거나
    // 외부 스토리지 서비스(예: Imgur, Cloudinary 등)를 사용하도록 안내
    return new Response(
      JSON.stringify({
        message: '썸네일 URL을 직접 입력해주세요.',
        error: '현재는 파일 업로드 기능이 지원되지 않습니다. 썸네일 URL을 직접 입력해주세요.',
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      }),
      { status: 400, headers: corsHeaders }
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

