// 기존 후기 삭제 스크립트

const https = require('https');

const options = {
  hostname: 'selledu.pages.dev',
  path: '/api/v1/admin/reviews/clear',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

// 실제로는 관리자 토큰이 필요하지만, 이 스크립트는 관리자 페이지에서 직접 버튼을 클릭하는 것을 권장합니다.
console.log('이 스크립트는 관리자 페이지의 "모든 후기 삭제" 버튼을 사용하는 것을 권장합니다.');
console.log('관리자 페이지 > 후기 관리 탭 > "모든 후기 삭제" 버튼을 클릭하세요.');

