// 기본 썸네일을 R2에 업로드하는 스크립트
// 사용법: node scripts/upload-default-thumbnail.js

const fs = require('fs');
const path = require('path');

async function uploadDefaultThumbnail() {
  try {
    // API 엔드포인트 URL
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8788/api/v1';
    const uploadUrl = `${apiUrl}/upload/default-thumbnail`;

    console.log('기본 썸네일 업로드 시작...');
    console.log('API URL:', uploadUrl);

    // POST 요청
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`업로드 실패: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json();
    console.log('✅ 기본 썸네일 업로드 완료!');
    console.log('썸네일 URL:', result.thumbnail_url);
    console.log('파일명:', result.file_name);

    return result;
  } catch (error) {
    console.error('❌ 기본 썸네일 업로드 실패:', error.message);
    console.error('상세 오류:', error);
    process.exit(1);
  }
}

// 스크립트 실행
uploadDefaultThumbnail();

