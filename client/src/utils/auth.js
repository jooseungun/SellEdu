export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
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
