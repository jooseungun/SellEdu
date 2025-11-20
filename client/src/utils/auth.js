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

// Base64 디코딩 (UTF-8 지원)
const base64Decode = (base64) => {
  try {
    // Base64 디코딩
    const binaryString = atob(base64);
    // UTF-8 디코딩을 위해 Uint8Array로 변환
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    // TextDecoder를 사용하여 UTF-8 디코딩
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(bytes);
  } catch (error) {
    console.error('Base64 decode error:', error);
    throw error;
  }
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
      const decodedString = base64Decode(token);
      decoded = JSON.parse(decodedString);
    } catch (decodeError) {
      // 디코딩 실패 시 토큰 정리 시도 (끝에 불필요한 문자가 있을 수 있음)
      const cleanedToken = token.replace(/[^A-Za-z0-9+/=]/g, '').replace(/=+$/, '');
      // 패딩 복원 (base64는 4의 배수여야 함)
      const padding = (4 - (cleanedToken.length % 4)) % 4;
      const paddedToken = cleanedToken + '='.repeat(padding);
      try {
        const decodedString = base64Decode(paddedToken);
        decoded = JSON.parse(decodedString);
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
  console.log('isAdmin check - user:', user, 'roles:', user?.roles);
  // 다중 권한 지원: roles 배열에 'admin'이 있거나, 기존 role 필드가 'admin'인 경우
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles.includes('admin');
  }
  return user?.role === 'admin';
};

// 판매자 권한 확인
export const isSeller = () => {
  const user = getUserFromToken();
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles.includes('seller');
  }
  return user?.role === 'seller';
};

// 구매자 권한 확인
export const isBuyer = () => {
  const user = getUserFromToken();
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles.includes('buyer');
  }
  return user?.role === 'buyer' || !user?.role; // 기본값은 buyer
};

// 사용자의 모든 권한 가져오기
export const getUserRoles = () => {
  const user = getUserFromToken();
  if (user?.roles && Array.isArray(user.roles)) {
    return user.roles;
  }
  return user?.role ? [user.role] : ['buyer'];
};

// 사용자 이름 가져오기
export const getUserName = () => {
  const user = getUserFromToken();
  return user?.name || user?.username || '';
};
