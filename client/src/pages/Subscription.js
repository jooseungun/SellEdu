import React from 'react';
import { Container, Paper, Typography, Button, Box, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Subscription = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/buyer')}
        sx={{ mb: 3 }}
      >
        뒤로가기
      </Button>
      
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          구독 서비스
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          월 정액제로 모든 콘텐츠를 무제한으로 시청하세요!
        </Typography>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            구독 혜택
          </Typography>
          <List>
            <ListItem>
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <ListItemText primary="모든 콘텐츠 무제한 시청" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <ListItemText primary="광고 없는 깨끗한 시청 환경" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <ListItemText primary="신규 콘텐츠 우선 제공" />
            </ListItem>
            <ListItem>
              <CheckCircleIcon color="success" sx={{ mr: 2 }} />
              <ListItemText primary="언제든지 취소 가능" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 4,
            py: 2,
            fontSize: '1.2rem'
          }}
          onClick={() => {
            alert('구독 기능은 현재 개발 중입니다.');
          }}
        >
          구독하기 (월 9,900원)
        </Button>
      </Box>
    </Container>
  );
};

export default Subscription;

