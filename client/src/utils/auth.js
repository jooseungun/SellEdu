export const getToken = () => {
  return sessionStorage.getItem('token');
};

export const setToken = (token) => {
  sessionStorage.setItem('token', token);
};

export const removeToken = () => {
  sessionStorage.removeItem('token');
};

export const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

// 토큰에서 사용자 정보 추출
export const getUserFromToken = () => {
  try {
    const token = getToken();
    if (!token) {
      console.log('No token found');
      return null;
    }
    
    // Base64 디코딩 시도
    let decoded;
    try {
      decoded = JSON.parse(atob(token));
    } catch (decodeError) {
      // 디코딩 실패 시 토큰 정리 시도 (끝에 불필요한 문자가 있을 수 있음)
      const cleanedToken = token.replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
      // 패딩 복원 (base64는 4의 배수여야 함)
      const padding = (4 - (cleanedToken.length % 4)) % 4;
      const paddedToken = cleanedToken + '='.repeat(padding);
      try {
        decoded = JSON.parse(atob(paddedToken));
      } catch (retryError) {
        console.error('Token decode error after cleanup:', retryError);
        console.error('Original token:', token);
        console.error('Cleaned token:', paddedToken);
        return null;
      }
    }
    
    console.log('Decoded token:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    console.error('Token value:', getToken());
    return null;
  }
};

// 관리자 권한 확인
export const isAdmin = () => {
  const user = getUserFromToken();
  console.log('isAdmin check - user:', user, 'role:', user?.role);
  return user?.role === 'admin';
};

// 사용자 이름 가져오기
export const getUserName = () => {
  const user = getUserFromToken();
  return user?.name || user?.username || '';
};
