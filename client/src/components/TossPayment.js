import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const TossPayment = ({ amount, onSuccess, onFail }) => {
  const handlePaymentComplete = () => {
    // 실제 결제 없이 바로 결제 완료 처리
    if (onSuccess) {
      onSuccess('mock_payment_key');
    }
  };

  return (
    <Box sx={{ textAlign: 'center', py: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          결제 정보
        </Typography>
        <Typography variant="body1" color="text.secondary">
          결제 금액: {amount.toLocaleString()}원
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<CheckCircleIcon />}
        onClick={handlePaymentComplete}
        sx={{
          py: 1.5,
          fontSize: '16px',
          fontWeight: 'bold',
          backgroundColor: '#3182f6',
          '&:hover': {
            backgroundColor: '#2563eb',
          },
        }}
      >
        결제완료
      </Button>
    </Box>
  );
};

export default TossPayment;
