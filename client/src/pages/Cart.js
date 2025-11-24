import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Divider,
  CircularProgress,
  AppBar,
  Toolbar,
  Grid,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../utils/api';
import { getToken } from '../utils/auth';
import TossPayment from '../components/TossPayment';
import UserProfileDialog from '../components/UserProfileDialog';
import { getThumbnailUrl } from '../utils/thumbnail';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [navigate]);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      setCartItems(response.data.items || []);
      setTotalAmount(response.data.totalAmount || 0);
    } catch (error) {
      console.error('장바구니 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    try {
      await api.delete(`/cart/${cartItemId}`);
      fetchCart(); // 장바구니 새로고침
    } catch (error) {
      console.error('장바구니 삭제 실패:', error);
      alert('장바구니에서 삭제하는데 실패했습니다.');
    }
  };

  const handleQuantityChange = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    try {
      await api.put(`/cart/${cartItemId}`, { quantity: newQuantity });
      fetchCart(); // 장바구니 새로고침
    } catch (error) {
      console.error('수량 변경 실패:', error);
      alert('수량 변경에 실패했습니다.');
    }
  };

  const handlePurchase = async () => {
    if (cartItems.length === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    // 결제 요청 API 없이 바로 결제 다이얼로그 표시
    const orderName = cartItems.length === 1 
      ? cartItems[0].content.title 
      : `${cartItems[0].content.title} 외 ${cartItems.length - 1}개`;

    setPaymentInfo({
      amount: totalAmount,
      orderName: orderName
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = async (paymentKey) => {
    // 실제 결제 승인 API 호출 없이 바로 완료 처리
    alert('결제가 완료되었습니다!');
    setPaymentDialogOpen(false);
    setPaymentInfo(null);
    
    // 장바구니 비우기
    try {
      await Promise.all(cartItems.map(item => api.delete(`/cart/${item.id}`)));
    } catch (error) {
      console.error('장바구니 비우기 실패:', error);
    }
    
    // 장바구니 새로고침
    fetchCart();
    
    // 구매 내역 페이지로 이동하거나 홈으로 이동
    navigate('/buyer');
  };

  const handlePaymentFail = (error) => {
    console.error('결제 실패:', error);
    alert('결제에 실패했습니다. 다시 시도해주세요.');
    setPaymentDialogOpen(false);
    setPaymentInfo(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/buyer')}
            sx={{ color: 'white', mr: 2 }}
          >
            뒤로가기
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            장바구니
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          장바구니
        </Typography>

        {cartItems.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ShoppingCartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              장바구니가 비어있습니다
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/buyer')}
              sx={{ mt: 2 }}
            >
              콘텐츠 둘러보기
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {cartItems.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <CardMedia
                        component="img"
                        sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1 }}
                        image={getThumbnailUrl(item.content.thumbnailUrl)}
                        alt={item.content.title}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {item.content.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {item.content.description}
                        </Typography>
                        <Chip
                          label={item.content.category}
                          size="small"
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">수량:</Typography>
                            <TextField
                              type="number"
                              size="small"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                              inputProps={{ min: 1, style: { width: '60px', textAlign: 'center' } }}
                            />
                          </Box>
                          <Typography variant="h6" color="primary">
                            {(item.content.price * item.quantity).toLocaleString()}원
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={() => handleRemoveItem(item.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  주문 요약
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">상품 개수:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {cartItems.length}개
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body1">총 수량:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}개
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6">총 결제금액:</Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {totalAmount.toLocaleString()}원
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handlePurchase}
                  disabled={paymentLoading || cartItems.length === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    py: 1.5
                  }}
                >
                  {paymentLoading ? '처리 중...' : '전체 구매하기'}
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      {/* 결제 다이얼로그 */}
      <Dialog
        open={paymentDialogOpen && paymentInfo !== null}
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentInfo(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        {paymentInfo && (
          <>
            <DialogTitle>결제하기</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {paymentInfo.orderName}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  결제 금액: {paymentInfo.amount.toLocaleString()}원
                </Typography>
                <Divider sx={{ my: 2 }} />
                <TossPayment
                  amount={paymentInfo.amount}
                  onSuccess={handlePaymentSuccess}
                  onFail={handlePaymentFail}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setPaymentDialogOpen(false);
                setPaymentInfo(null);
              }}>
                취소
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};

export default Cart;

