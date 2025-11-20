import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../utils/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        // 결제 승인 API 호출
        await api.post('/payments/approve', {
          orderId: orderId,
          paymentKey: paymentKey,
          amount: parseInt(amount)
        });

        setLoading(false);
      } catch (error) {
        console.error('결제 승인 실패:', error);
        setError(error.response?.data?.error || '결제 승인에 실패했습니다.');
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

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

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            결제 실패
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/buyer')}>
            콘텐츠 목록으로 돌아가기
          </Button>
        </Paper>
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

