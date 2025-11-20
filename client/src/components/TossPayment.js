import React, { useEffect, useRef, useState } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { Box, CircularProgress } from '@mui/material';

const TossPayment = ({ orderId, orderNumber, amount, orderName, customerName, customerEmail, successUrl, failUrl, onSuccess, onFail }) => {
  const paymentWidgetRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // 토스페이먼츠 클라이언트 키 (환경 변수에서 가져오기)
        const clientKey = process.env.REACT_APP_TOSS_CLIENT_KEY || 'test_ck_DpexMgkW36w8qJ4KzL8gLzN97Eoq';
        
        if (!clientKey) {
          throw new Error('토스페이먼츠 클라이언트 키가 설정되지 않았습니다.');
        }
        
        // 토스페이먼츠 SDK 초기화
        const tossPayments = await loadTossPayments(clientKey);
        
        // 결제 위젯 생성
        const paymentWidget = tossPayments.widgets({
          customerKey: customerEmail || `customer_${orderId}`,
        });
        
        paymentWidgetRef.current = paymentWidget;
        
        // 결제 수단 위젯 생성
        await paymentWidget.renderPaymentMethods(
          '#payment-widget',
          { value: amount },
          { variantKey: 'DEFAULT' }
        );
        
        // 이용약관 위젯 생성
        paymentWidget.renderAgreement('#agreement-widget', {
          variantKey: 'AGREEMENT',
        });
        
        setLoading(false);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
        setError(error.message || '결제 위젯 초기화에 실패했습니다.');
        setLoading(false);
        if (onFail) {
          onFail(error);
        }
      }
    };

    if (amount > 0 && orderId && orderNumber) {
      initializePayment();
    } else {
      setLoading(false);
    }

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (paymentWidgetRef.current) {
        try {
          // 위젯 정리 (토스페이먼츠 SDK가 정리 메서드를 제공하는 경우)
          paymentWidgetRef.current = null;
        } catch (e) {
          console.warn('위젯 정리 중 오류:', e);
        }
      }
    };
  }, [amount, orderId, orderNumber, customerEmail, onFail]);

  const handlePayment = async () => {
    try {
      if (!paymentWidgetRef.current) {
        throw new Error('결제 위젯이 초기화되지 않았습니다.');
      }

      // 결제 요청
      await paymentWidgetRef.current.requestPayment({
        orderId: orderNumber,
        orderName: orderName,
        customerName: customerName,
        customerEmail: customerEmail,
        successUrl: successUrl,
        failUrl: failUrl,
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      if (onFail) {
        onFail(error);
      } else {
        alert('결제 요청에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
        {error}
      </Box>
    );
  }

  return (
    <Box>
      <Box id="payment-widget" sx={{ mb: 3 }} />
      <Box id="agreement-widget" sx={{ mb: 3 }} />
      <button
        onClick={handlePayment}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: '#3182f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#3182f6'}
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </Box>
  );
};

export default TossPayment;

