import axios from 'axios';
import { getAuthHeaders } from './auth';

// 백엔드 API URL 설정
// 개발 환경: 로컬 서버 또는 환경 변수
// 프로덕션: 백엔드 서버 주소 (Railway, Render 등)
const getApiUrl = () => {
  // 환경 변수가 설정되어 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 개발 환경에서는 로컬 서버 사용
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api/v1';
  }
  
  // 프로덕션: Cloudflare Pages Functions 사용
  // Cloudflare Pages Functions는 /api/* 경로로 자동 라우팅됨
  return '/api/v1';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10초 타임아웃
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const headers = getAuthHeaders();
    if (headers.Authorization) {
      config.headers.Authorization = headers.Authorization;
      console.log('API Request - Authorization header added, length:', headers.Authorization.length);
      console.log('API Request - URL:', config.url);
    } else {
      console.log('API Request - No Authorization header, URL:', config.url);
    }
    // FormData를 사용하는 경우 Content-Type을 제거하여 브라우저가 자동으로 설정하도록 함
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => {
    // 성공 응답 로깅
    console.log('API Response - Success:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    // 네트워크 에러 또는 서버 연결 실패
    if (!error.response) {
      console.error('API - Network Error:', {
        url: error.config?.url,
        message: error.message,
        code: error.code
      });
      // 개발 환경에서만 경고
      if (process.env.NODE_ENV === 'development') {
        if (error.code === 'ECONNABORTED') {
          alert('요청 시간이 초과되었습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
        } else if (error.message.includes('Network Error')) {
          alert('네트워크 오류가 발생했습니다. 백엔드 서버 주소를 확인해주세요.');
        }
      }
      return Promise.reject(error);
    }
    
    // 응답이 있는 경우 상세 로깅
    const errorResponse = error.response;
    console.error('API - Error Response:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: errorResponse.status,
      statusText: errorResponse.statusText,
      data: errorResponse.data,
      headers: {
        'content-type': errorResponse.headers['content-type'],
        'authorization': errorResponse.headers['authorization'] ? 'present' : 'missing'
      }
    });
    
    // 401 에러: 인증 실패
    if (errorResponse.status === 401) {
      console.error('API - 401 Unauthorized:', {
        url: error.config?.url,
        errorMessage: errorResponse.data?.error,
        errorDetails: errorResponse.data?.details,
        requestHeaders: {
          authorization: error.config?.headers?.Authorization ? 'present' : 'missing'
        }
      });
      sessionStorage.removeItem('token');
      // 로그인 페이지가 아닌 경우에만 리다이렉트
      // 판매자 페이지에서는 자체적으로 처리하므로 여기서는 리다이렉트하지 않음
      if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/seller')) {
        window.location.href = '/login';
      }
    }
    
    // 500 에러: 서버 내부 오류
    if (errorResponse.status === 500) {
      const errorData = errorResponse.data;
      console.error('API - 500 Server Error:', {
        url: error.config?.url,
        error: errorData?.error,
        details: errorData?.details,
        type: errorData?.type
      });
    }
    
    // 405 에러: Method Not Allowed
    if (errorResponse.status === 405) {
      console.error('API - 405 Method Not Allowed:', {
        url: error.config?.url,
        method: error.config?.method
      });
      alert('API 서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.');
    }
    
    return Promise.reject(error);
  }
);

export default api;


