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
 * Cloudflare Workers 환경에서 안정적으로 작동하도록 최적화
 * 로그인 API의 인코딩 방식과 정확히 일치하도록 구현
 */
export function decodeToken(token: string): TokenData | null {
  try {
    console.log('decodeToken - Input token length:', token.length);
    console.log('decodeToken - Input token first 50 chars:', token.substring(0, 50));
    
    // 토큰 정리 (불필요한 문자 제거)
    let cleanedToken = token.replace(/[^A-Za-z0-9+/=]/g, '');
    console.log('decodeToken - Cleaned token length:', cleanedToken.length);
    
    // 패딩 복원 (base64는 4의 배수여야 함)
    const padding = (4 - (cleanedToken.length % 4)) % 4;
    cleanedToken = cleanedToken + '='.repeat(padding);
    console.log('decodeToken - Padded token length:', cleanedToken.length);
    
    // Base64 디코딩 - 로그인 API의 인코딩 방식과 정확히 일치하도록 구현
    const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const base64Map: { [key: string]: number } = {};
    for (let i = 0; i < base64Chars.length; i++) {
      base64Map[base64Chars[i]] = i;
    }
    base64Map['='] = 0;
    
    let binaryString = '';
    for (let i = 0; i < cleanedToken.length; i += 4) {
      const char1 = cleanedToken[i] || '=';
      const char2 = cleanedToken[i + 1] || '=';
      const char3 = cleanedToken[i + 2] || '=';
      const char4 = cleanedToken[i + 3] || '=';
      
      const enc1 = base64Map[char1] || 0;
      const enc2 = base64Map[char2] || 0;
      const enc3 = base64Map[char3] || 0;
      const enc4 = base64Map[char4] || 0;
      
      const bitmap = (enc1 << 18) | (enc2 << 12) | (enc3 << 6) | enc4;
      
      // 패딩 처리 - 로그인 API의 인코딩과 역순으로 처리
      if (char3 !== '=') {
        binaryString += String.fromCharCode((bitmap >> 16) & 255);
      }
      if (char4 !== '=') {
        binaryString += String.fromCharCode((bitmap >> 8) & 255);
        binaryString += String.fromCharCode(bitmap & 255);
      } else if (char3 !== '=') {
        binaryString += String.fromCharCode((bitmap >> 8) & 255);
      }
    }
    
    console.log('decodeToken - Binary string length:', binaryString.length);
    
    // 로그인 API는 TextEncoder로 UTF-8 인코딩 후 base64 인코딩하므로
    // 디코딩도 UTF-8 디코딩이 필요함
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decoder = new TextDecoder('utf-8');
    const decodedString = decoder.decode(bytes);
    console.log('decodeToken - Decoded string length:', decodedString.length);
    console.log('decodeToken - Decoded string first 100 chars:', decodedString.substring(0, 100));
    
    // JSON 파싱
    const tokenData = JSON.parse(decodedString) as TokenData;
    console.log('decodeToken - Success:', { userId: tokenData.userId, username: tokenData.username, role: tokenData.role });
    
    // 토큰 만료 확인
    if (tokenData.exp && tokenData.exp < Date.now()) {
      console.log('decodeToken - Token expired:', tokenData.exp, 'Current:', Date.now());
      return null;
    }
    
    return tokenData;
  } catch (error: any) {
    console.error('decodeToken - Error:', error.message);
    console.error('decodeToken - Error type:', error.name);
    console.error('decodeToken - Stack:', error.stack);
    console.error('decodeToken - Input token (first 100):', token.substring(0, 100));
    return null;
  }
}

/**
 * Authorization 헤더에서 토큰을 추출하고 디코딩
 */
export function getTokenFromRequest(request: Request): TokenData | null {
  console.log('getTokenFromRequest - Checking headers');
  
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  console.log('getTokenFromRequest - Authorization header:', authHeader ? `exists (length: ${authHeader.length})` : 'missing');
  
  if (!authHeader) {
    console.log('getTokenFromRequest - No authorization header');
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('getTokenFromRequest - Invalid header format:', authHeader.substring(0, 20));
    return null;
  }
  
  const token = authHeader.substring(7);
  console.log('getTokenFromRequest - Extracted token length:', token.length);
  console.log('getTokenFromRequest - Extracted token first 50 chars:', token.substring(0, 50));
  
  const decoded = decodeToken(token);
  console.log('getTokenFromRequest - Decode result:', decoded ? 'SUCCESS' : 'FAILED');
  
  return decoded;
}

