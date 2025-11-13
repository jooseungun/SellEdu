import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import api from '../utils/api';

const AdminDashboard = () => {
  const [gradePolicies, setGradePolicies] = useState([]);

  useEffect(() => {
    fetchGradePolicies();
  }, []);

  const fetchGradePolicies = async () => {
    try {
      const response = await api.get('/admin/grade-policies');
      setGradePolicies(response.data || []);
    } catch (error) {
      console.error('등급 정책 조회 실패:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        관리자 대시보드
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          등급 정책 관리
        </Typography>
        <Box>
          {gradePolicies.map((policy) => (
            <Box key={policy.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle1">
                {policy.user_type} - {policy.grade_name}
              </Typography>
              <Typography variant="body2">
                최소 금액: {policy.min_amount?.toLocaleString()}원
                {policy.max_amount && ` ~ ${policy.max_amount.toLocaleString()}원`}
              </Typography>
              {policy.user_type === 'buyer' && (
                <Typography variant="body2">
                  할인율: {policy.discount_rate}%
                </Typography>
              )}
              {policy.user_type === 'seller' && (
                <Typography variant="body2">
                  수수료율: {policy.commission_rate}%
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminDashboard;


