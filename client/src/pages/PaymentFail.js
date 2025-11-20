import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const PaymentFail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const getErrorMessage = () => {
    if (errorMessage) {
      return errorMessage;
    }
    if (errorCode) {
      return `오류 코드: ${errorCode}`;
    }
    return '결제에 실패했습니다.';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        <Typography variant="h4" color="error" gutterBottom>
          결제 실패
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
          {getErrorMessage()}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/buyer')}>
          콘텐츠 목록으로 돌아가기
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentFail;

