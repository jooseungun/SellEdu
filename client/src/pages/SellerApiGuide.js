import React from 'react';
import { Container, Paper, Typography, Box, Button, Divider, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';

const SellerApiGuide = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/seller')}
        sx={{ mb: 3 }}
      >
        뒤로가기
      </Button>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CodeIcon sx={{ fontSize: 40, mr: 2, color: 'secondary.main' }} />
          <Typography variant="h4" component="h1">
            LMS/CMS API 연동 가이드
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          외부 LMS/CMS 시스템과 연동하여 콘텐츠를 자동으로 등록할 수 있는 API 가이드입니다.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          1. 인증
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`API Key 발급:
1. 판매자 대시보드 → API 설정 메뉴 접속
2. "API Key 생성" 버튼 클릭
3. 발급된 API Key를 안전하게 보관

요청 헤더:
Authorization: Bearer {YOUR_API_KEY}
Content-Type: application/json`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. 콘텐츠 불러오기 (Import)
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`POST /api/v1/seller/contents/import
Headers:
  Authorization: Bearer {YOUR_API_KEY}
  Content-Type: application/json

Request Body:
{
  "lms_course_id": "course_123",
  "title": "강의 제목",
  "description": "강의 설명",
  "price": 50000,
  "lessons": [
    {
      "lesson_number": 1,
      "title": "1차시",
      "cdn_link": "https://..."
    }
  ]
}

Response:
{
  "message": "콘텐츠가 성공적으로 불러와졌습니다.",
  "content_id": 123
}`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. 콘텐츠 심사 신청
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`POST /api/v1/seller/contents/apply
Headers:
  Authorization: Bearer {YOUR_API_KEY}
  Content-Type: application/json

Request Body:
{
  "content_id": 123,
  "thumbnail_url": "https://...",
  "tags": ["태그1", "태그2"],
  "sale_start_date": "2024-01-01T00:00:00Z",
  "sale_end_date": "2024-12-31T23:59:59Z",
  "is_always_on_sale": false
}

Response:
{
  "message": "콘텐츠 심사 신청이 완료되었습니다.",
  "content_id": 123
}`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. 연동 예시 (JavaScript)
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`// LMS에서 콘텐츠 불러오기
async function importContent(courseId) {
  const response = await fetch('https://api.selledu.com/api/v1/seller/contents/import', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      lms_course_id: courseId,
      // ... 기타 필수 정보
    })
  });
  
  const data = await response.json();
  return data.content_id;
}

// 불러온 콘텐츠 심사 신청
async function applyForReview(contentId) {
  const response = await fetch('https://api.selledu.com/api/v1/seller/contents/apply', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content_id: contentId,
      // ... 기타 정보
    })
  });
  
  return await response.json();
}`}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
          <Typography variant="body2" color="info.dark">
            <strong>참고:</strong> 현재 API는 개발 중입니다. 실제 연동을 위해서는 API Key 발급 및 추가 설정이 필요합니다.
            자세한 내용은 고객지원으로 문의해주세요.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default SellerApiGuide;

