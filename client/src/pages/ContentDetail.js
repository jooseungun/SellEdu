import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, Chip } from '@mui/material';
import api from '../utils/api';
import { getToken } from '../utils/auth';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const response = await api.get(`/contents/${id}`);
      setContent(response.data);
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/purchase', { content_id: parseInt(id) });
      alert('구매가 완료되었습니다!');
    } catch (error) {
      alert(error.response?.data?.error || '구매에 실패했습니다.');
    }
  };

  if (loading) return <Container>로딩 중...</Container>;
  if (!content) return <Container>콘텐츠를 찾을 수 없습니다.</Container>;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {content.title}
        </Typography>
        <Typography variant="body1" paragraph>
          {content.description}
        </Typography>
        <Box sx={{ my: 2 }}>
          <Typography variant="h5" color="primary">
            {content.price?.toLocaleString()}원
          </Typography>
        </Box>
        <Box sx={{ my: 2 }}>
          <Button variant="contained" size="large" onClick={handlePurchase}>
            구매하기
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContentDetail;

