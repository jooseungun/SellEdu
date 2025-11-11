import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';
import api from '../utils/api';

const SellerDashboard = () => {
  const [contents, setContents] = useState([]);
  const [settlements, setSettlements] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [contentsRes, settlementsRes] = await Promise.all([
        api.get('/contents/seller/list'),
        api.get('/seller/settlement')
      ]);
      setContents(contentsRes.data || []);
      setSettlements(settlementsRes.data?.histories || []);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        판매자 대시보드
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          판매 중인 콘텐츠
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>제목</TableCell>
                <TableCell>가격</TableCell>
                <TableCell>구매 수</TableCell>
                <TableCell>총 판매액</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contents.map((content) => (
                <TableRow key={content.id}>
                  <TableCell>{content.title}</TableCell>
                  <TableCell>{content.price?.toLocaleString()}원</TableCell>
                  <TableCell>{content.purchase_count || 0}</TableCell>
                  <TableCell>{content.total_sales?.toLocaleString() || 0}원</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          정산 내역
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>정산 기간</TableCell>
                <TableCell>정산 금액</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement.id}>
                  <TableCell>
                    {settlement.settlement_period_start} ~ {settlement.settlement_period_end}
                  </TableCell>
                  <TableCell>{settlement.seller_amount?.toLocaleString()}원</TableCell>
                  <TableCell>{settlement.settlement_status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default SellerDashboard;

