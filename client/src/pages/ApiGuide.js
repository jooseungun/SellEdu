import React from 'react';
import { Container, Paper, Typography, Box, Button, Divider, Code, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';

const ApiGuide = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        뒤로가기
      </Button>

      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <CodeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            API 연동 가이드
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          SellEdu 플랫폼의 콘텐츠를 외부 사이트에 연동하여 사용할 수 있는 API 가이드입니다.
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
Authorization: Bearer {YOUR_API_KEY}`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          2. 콘텐츠 목록 조회
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`GET /api/v1/contents
Headers:
  Authorization: Bearer {YOUR_API_KEY}

Response:
{
  "contents": [
    {
      "id": 1,
      "title": "콘텐츠 제목",
      "description": "설명",
      "price": 50000,
      "thumbnail_url": "https://...",
      "cdn_link": "https://..."
    }
  ]
}`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          3. 콘텐츠 상세 조회
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`GET /api/v1/contents/{content_id}
Headers:
  Authorization: Bearer {YOUR_API_KEY}

Response:
{
  "id": 1,
  "title": "콘텐츠 제목",
  "description": "상세 설명",
  "price": 50000,
  "lessons": [
    {
      "lesson_number": 1,
      "title": "1차시",
      "cdn_link": "https://..."
    }
  ]
}`}
            </Typography>
          </CardContent>
        </Card>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          4. 콘텐츠 임베드
        </Typography>
        <Card sx={{ mb: 3, bgcolor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
{`GET /api/v1/embed/{content_id}
Headers:
  Authorization: Bearer {YOUR_API_KEY}

Response:
{
  "embed_code": "<iframe src='https://selledu.pages.dev/player/{content_id}'></iframe>",
  "embed_url": "https://selledu.pages.dev/player/{content_id}"
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

export default ApiGuide;

