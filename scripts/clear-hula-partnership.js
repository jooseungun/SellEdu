// 훌라로 관련 제휴할인 신청 데이터 삭제 스크립트
// 이 스크립트는 한 번만 실행하여 DB에서 훌라로 관련 데이터를 삭제합니다.

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_BASE_URL || 'https://selledu.pages.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

if (!ADMIN_TOKEN) {
  console.error('❌ ADMIN_TOKEN 환경 변수가 설정되지 않았습니다.');
  console.log('사용법: ADMIN_TOKEN="your_admin_token" node scripts/clear-hula-partnership.js');
  process.exit(1);
}

async function clearHulaData() {
  try {
    console.log('🔄 훌라로 관련 제휴할인 신청 데이터 삭제 중...');
    
    // API 호출을 위한 URL 파싱
    const url = new URL(`${API_BASE_URL}/api/v1/admin/partnership/clear-hula`);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode === 200) {
              console.log('✅ 훌라로 데이터 삭제 완료!');
              console.log(`   - 삭제된 신청: ${result.deleted_count || 0}건`);
              console.log(`   - 할인율 초기화된 사용자: ${result.reset_discount_count || 0}명`);
              resolve(result);
            } else {
              console.error('❌ 삭제 실패:', result.error || result.message);
              reject(new Error(result.error || '삭제 실패'));
            }
          } catch (e) {
            console.error('❌ 응답 파싱 실패:', e.message);
            console.error('응답 데이터:', data);
            reject(e);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ 요청 실패:', error.message);
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    throw error;
  }
}

// 스크립트 실행
clearHulaData()
  .then(() => {
    console.log('✨ 작업 완료!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 작업 실패:', error);
    process.exit(1);
  });

