import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제 결제 승인 API 호출 없이 바로 완료 처리
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          결제를 처리하는 중입니다...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          결제가 완료되었습니다!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          구매해주셔서 감사합니다.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="outlined" onClick={() => navigate('/buyer')}>
            콘텐츠 목록
          </Button>
          <Button variant="contained" onClick={() => navigate('/buyer')}>
            내 구매 내역
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;

