// 기본 썸네일 URL 가져오기
export const getDefaultThumbnailUrl = () => {
  // R2에 저장된 기본 썸네일 URL
  // 경로: default-thumbnail.svg
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? (window.location.port === '8788' ? '' : 'http://localhost:8788')
    : '';
  
  const encodedPath = encodeURIComponent('default-thumbnail.svg');
  return `${baseUrl}/api/v1/images/${encodedPath}`;
};

// 썸네일 URL이 없을 때 기본 썸네일 URL 반환
export const getThumbnailUrl = (thumbnailUrl) => {
  if (!thumbnailUrl || thumbnailUrl.trim() === '') {
    return getDefaultThumbnailUrl();
  }
  return thumbnailUrl;
};

