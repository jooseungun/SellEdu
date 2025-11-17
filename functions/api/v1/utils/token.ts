// 공통 토큰 디코딩 유틸리티
// 클라이언트와 서버에서 동일한 방식으로 토큰을 디코딩하기 위한 공통 함수

export interface TokenData {
  userId: number;
  username: string;
  name: string;
  role: string;
  exp: number;
}

/**
 * Base64 문자열을 디코딩하여 토큰 데이터를 반환
 */
export function decodeToken(token: string): TokenData | null {
  try {
    // 토큰 정리 (불필요한 문자 제거)
    let cleanedToken = token.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // 패딩 복원 (base64는 4의 배수여야 함)
    const padding = (4 - (cleanedToken.length % 4)) % 4;
    cleanedToken = cleanedToken + '='.repeat(padding);
    
    // Base64 디코딩
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64Map: { [key: string]: number } = {};
    for (let i = 0; i < base64Chars.length; i++) {
      base64Map[base64Chars[i]] = i;
    }
    base64Map['='] = 0;
    
    let binaryString = '';
    for (let i = 0; i < cleanedToken.length; i += 4) {
      const enc1 = base64Map[cleanedToken[i]] || 0;
      const enc2 = base64Map[cleanedToken[i + 1] || '='] || 0;
      const enc3 = base64Map[cleanedToken[i + 2] || '='] || 0;
      const enc4 = base64Map[cleanedToken[i + 3] || '='] || 0;
      
      const bitmap = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
      
      if (cleanedToken[i + 2] && cleanedToken[i + 2] !== '=') {
        binaryString += String.fromCharCode((bitmap >> 16) & 255);
      }
      if (cleanedToken[i + 3] && cleanedToken[i + 3] !== '=') {
        binaryString += String.fromCharCode((bitmap >> 8) & 255);
        binaryString += String.fromCharCode(bitmap & 255);
      } else if (cleanedToken[i + 2] && cleanedToken[i + 2] !== '=') {
        binaryString += String.fromCharCode((bitmap >> 8) & 255);
      }
    }
    
    // UTF-8 디코딩
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(bytes);
    
    // JSON 파싱
    const tokenData = JSON.parse(decodedString) as TokenData;
    
    // 토큰 만료 확인
    if (tokenData.exp && tokenData.exp < Date.now()) {
      console.log('Token expired:', tokenData.exp, 'Current:', Date.now());
      return null;
    }
    
    return tokenData;
  } catch (error: any) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Authorization 헤더에서 토큰을 추출하고 디코딩
 */
export function getTokenFromRequest(request: Request): TokenData | null {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return decodeToken(token);
}

