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
    if (!token) return null;
    
    // Base64 디코딩
    const decoded = JSON.parse(atob(token));
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// 관리자 권한 확인
export const isAdmin = () => {
  const user = getUserFromToken();
  return user?.role === 'admin';
};

// 사용자 이름 가져오기
export const getUserName = () => {
  const user = getUserFromToken();
  return user?.name || user?.username || '';
};
