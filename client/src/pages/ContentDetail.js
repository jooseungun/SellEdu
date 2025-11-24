import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box, 
  Chip,
  AppBar,
  Toolbar,
  Rating,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Grid,
  CardMedia,
  IconButton,
  CircularProgress,
  Breadcrumbs,
  Link
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import api from '../utils/api';
import { getToken, getUserName } from '../utils/auth';
import TossPayment from '../components/TossPayment';
import UserProfileDialog from '../components/UserProfileDialog';
import { getThumbnailUrl } from '../utils/thumbnail';

// 더미 데이터 생성 함수 제거됨 - 실제 DB 데이터만 사용
// HTML 태그 제거 함수
const stripHtmlTags = (html) => {
  if (!html) return '';
  if (typeof document === 'undefined') {
    // 서버 사이드에서는 정규식으로 처리
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  }
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState(null);

  useEffect(() => {
    fetchContent();
    fetchReviews();
    fetchBuyerInfo();
  }, [id]);

  const fetchBuyerInfo = async () => {
    if (!getToken()) {
      return;
    }
    try {
      const response = await api.get('/buyer/info');
      setBuyerInfo(response.data);
    } catch (error) {
      console.error('구매자 정보 조회 실패:', error);
      // 에러가 발생해도 계속 진행 (할인율이 0으로 처리됨)
    }
  };

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/contents/${id}`);
      console.log('ContentDetail - API response:', response.data);
      
      if (response.data && response.data.id) {
        // API 응답 데이터를 그대로 사용하되, 필요한 필드가 없으면 기본값 설정
        // avg_rating과 review_count는 DB에서 실제 값 사용 (null이면 0으로 표시)
        const contentData = {
          ...response.data,
          detailed_description: response.data.detailed_description || response.data.description || '',
          lessons: response.data.lessons || [],
          tags: response.data.tags || (response.data.category ? [response.data.category, '온라인', '실무'] : ['온라인', '실무']),
          instructor: response.data.instructor || response.data.seller_name || response.data.seller_username || '기업명',
          education_period: response.data.education_period || 999,
          thumbnail_url: response.data.thumbnail_url || null,
          avg_rating: response.data.avg_rating || null,
          review_count: response.data.review_count || 0
        };
        setContent(contentData);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error);
      console.error('Error details:', error.response?.data);
      // API 실패 시 콘텐츠를 null로 설정하여 에러 메시지 표시
      setContent(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/contents/${id}/reviews`);
      setReviews(response.data?.reviews || []);
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
      setReviews([]);
    }
  };


  const handlePurchase = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    if (!content || content.price <= 0) {
      alert('무료 콘텐츠는 구매할 수 없습니다.');
      return;
    }

    try {
      setPaymentLoading(true);
      // 주문 생성 API 호출
      const response = await api.post('/payments/request', {
        content_id: content.id,
        amount: content.price
      });
      
      if (response.data && response.data.orderId) {
        setPaymentInfo({
          orderId: response.data.orderId,
          amount: response.data.amount || content.price, // 할인이 적용된 최종 금액 사용
          orderName: content.title
        });
        setPaymentDialogOpen(true);
      } else {
        alert('주문 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('주문 생성 실패:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.details || error?.message || '알 수 없는 오류';
      const errorDetails = error?.response?.data?.details ? `\n상세: ${error.response.data.details}` : '';
      alert(`주문 생성에 실패했습니다.\n${errorMessage}${errorDetails}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentKey) => {
    try {
      // 결제 승인 API 호출
      if (paymentInfo && paymentInfo.orderId) {
        await api.post('/payments/approve', {
          orderId: paymentInfo.orderId,
          paymentKey: paymentKey || `sim_${Date.now()}`,
          amount: paymentInfo.amount
        });
      }
      
      alert('결제가 완료되었습니다!');
      setPaymentDialogOpen(false);
      setPaymentInfo(null);
      
      // 콘텐츠 정보 새로고침
      fetchContent();
    } catch (error) {
      console.error('결제 승인 실패:', error);
      alert('결제 승인 처리에 실패했습니다. 관리자에게 문의해주세요.');
    }
  };

  const handlePaymentFail = (error) => {
    console.error('결제 실패:', error);
    alert('결제에 실패했습니다. 다시 시도해주세요.');
    setPaymentDialogOpen(false);
    setPaymentInfo(null);
  };

  const handleAddToCart = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    if (!content || content.price <= 0) {
      alert('무료 콘텐츠는 장바구니에 추가할 수 없습니다.');
      return;
    }

    setCartLoading(true);
    try {
      await api.post('/cart/add', {
        content_id: content.id,
        quantity: 1
      });
      alert('장바구니에 추가되었습니다!');
    } catch (error) {
      console.error('장바구니 추가 실패:', error);
      alert(error.response?.data?.error || '장바구니에 추가하는데 실패했습니다.');
    } finally {
      setCartLoading(false);
    }
  };



  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: content?.title,
        text: content?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 클립보드에 복사되었습니다.');
    }
  };

  const getGradeColor = (grade) => {
    const colorMap = {
      '베이직': '#4CAF50',
      '프리미엄': '#FF9800',
      '스탠다드': '#2196F3',
      '개별구매': '#9C27B0'
    };
    return colorMap[grade] || '#757575';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!content) {
    return (
      <Container>
        <Typography variant="h6">콘텐츠를 찾을 수 없습니다.</Typography>
      </Container>
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
          <Typography
            variant="h6"
            component="div"
            onClick={() => navigate('/')}
            sx={{
              flexGrow: 0,
              mr: 3,
              cursor: 'pointer',
              fontWeight: 'bold',
              userSelect: 'none',
              '&:hover': {
                opacity: 0.8
              }
            }}
          >
            SellEdu
          </Typography>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            콘텐츠 상세
          </Typography>
          {getToken() && getUserName() && (
            <Typography variant="body1" sx={{ color: 'white', mr: 2 }}>
              {getUserName()}님 환영합니다
            </Typography>
          )}
          {getToken() && (
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setProfileDialogOpen(true)}
              sx={{ 
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              정보 변경
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, color: '#000' }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            홈
          </Link>
          <Link color="inherit" onClick={() => navigate('/buyer')} sx={{ cursor: 'pointer' }}>
            콘텐츠 구매
          </Link>
          <Typography color="text.primary">{content.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={3}>
          {/* 왼쪽: 과정 이미지 및 정보 */}
          <Grid item xs={12} md={8}>
            {/* 과정 이미지 */}
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="450"
                image={getThumbnailUrl(content.thumbnail_url)}
                alt={content.title}
                sx={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = getThumbnailUrl();
                }}
              />
            </Card>

            {/* 과정 제목 및 정보 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {content.tags?.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={`#${tag}`}
                        size="small"
                        sx={{
                          bgcolor: '#e3f2fd',
                          color: '#1976d2'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {content.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Rating value={parseFloat(content.avg_rating || 0)} readOnly precision={0.1} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      ⭐ {content.avg_rating || '0'}점
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({content.review_count || 0}개 리뷰)
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={handleShare} sx={{ ml: 2 }}>
                  <ShareIcon />
                </IconButton>
              </Box>

              {/* 샘플 보기 버튼 */}
              {content.lessons && content.lessons.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setPreviewOpen(true)}
                  sx={{ mb: 2 }}
                >
                  샘플 보기
                </Button>
              )}

              {/* 탭 메뉴 */}
              <Tabs
                value={tabValue}
                onChange={(e, v) => setTabValue(v)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab label="콘텐츠 소개" />
                <Tab label="콘텐츠 목차" />
                <Tab label="상품 정보" />
                <Tab label="상품 후기" />
              </Tabs>

              {/* 탭 내용 */}
              {tabValue === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                    콘텐츠 소개
                  </Typography>
                  <Box 
                    sx={{ 
                      '& p': { mb: 2, lineHeight: 1.8 },
                      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                      '& ul, & ol': { pl: 3, mb: 2 },
                      '& li': { mb: 1 }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: content.detailed_description || content.description || '' 
                    }}
                  />
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    콘텐츠 정보
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        이용기간
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {content.education_period || 999}일
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        콘텐츠 구성
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {content.lessons?.length || 0}개
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        제공 기업
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {content.instructor || content.seller_username || '기업명'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                    콘텐츠 목차 (총 {content.lessons?.length || 0}개)
                  </Typography>
                  {content.lessons && content.lessons.length > 0 ? (
                    content.lessons.map((lesson, index) => (
                      <Card key={lesson.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {lesson.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {lesson.duration}분
                              </Typography>
                            </Box>
                              <Chip
                              label={index === 0 ? '샘플' : `${index + 1}번`}
                              size="small"
                              color={index === 0 ? 'primary' : 'default'}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      콘텐츠 목차가 없습니다.
                    </Typography>
                  )}
                </Box>
              )}

              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                    상품 정보
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    현재 등록된 추가 상품이 없습니다.
                  </Typography>
                </Box>
              )}

              {tabValue === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                    상품 후기 ({reviews.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {reviews.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      아직 리뷰가 없습니다.
                    </Typography>
                  ) : (
                    reviews.map((review) => (
                      <Card key={review.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {review.buyer_name || review.buyer_username}
                            </Typography>
                            <Rating value={review.rating} readOnly size="small" />
                          </Box>
                          <Typography variant="body2" paragraph>
                            {review.comment || '내용 없음'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(review.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 오른쪽: 구매 가격 및 구매 정보 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                구매 가격
              </Typography>
              <Box sx={{ mb: 3 }}>
                {content.price > 0 ? (() => {
                  const discountRate = buyerInfo?.discount_rate || 0;
                  const discountAmount = Math.floor(content.price * discountRate / 100);
                  const finalPrice = content.price - discountAmount;
                  const hasDiscount = discountRate > 0 && discountAmount > 0;

                  return (
                    <Box>
                      {hasDiscount ? (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 'bold',
                                textDecoration: 'line-through',
                                color: 'text.secondary'
                              }}
                            >
                              {content.price.toLocaleString()}원
                            </Typography>
                            <Chip 
                              label={`${discountRate}% 할인`} 
                              color="error" 
                              size="small"
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                            {finalPrice.toLocaleString()}원
                          </Typography>
                          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                            제휴할인 적용: {discountAmount.toLocaleString()}원 할인
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                          {content.price.toLocaleString()}원
                        </Typography>
                      )}
                    </Box>
                  );
                })() : (
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    무료
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  총 결제금액
                </Typography>
                {content.price > 0 ? (() => {
                  const discountRate = buyerInfo?.discount_rate || 0;
                  const discountAmount = Math.floor(content.price * discountRate / 100);
                  const finalPrice = content.price - discountAmount;
                  const hasDiscount = discountRate > 0 && discountAmount > 0;

                  return (
                    <Box>
                      {hasDiscount ? (
                        <>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textDecoration: 'line-through',
                              color: 'text.secondary',
                              mb: 0.5
                            }}
                          >
                            {content.price.toLocaleString()}원
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                            {finalPrice.toLocaleString()}원
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {content.price.toLocaleString()}원
                        </Typography>
                      )}
                    </Box>
                  );
                })() : (
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    무료
                  </Typography>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleAddToCart}
                  disabled={cartLoading || content.price <= 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 1.5,
                    mb: 1
                  }}
                >
                  {cartLoading ? '처리 중...' : '장바구니'}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handlePurchase}
                  disabled={paymentLoading || content.price <= 0}
                  sx={{
                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    py: 1.5
                  }}
                >
                  {paymentLoading ? '처리 중...' : content.price > 0 ? '구매' : '무료'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* 맛보기 다이얼로그 */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {content.lessons && content.lessons[0] ? content.lessons[0].title : '샘플 보기'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              샘플 콘텐츠 재생 기능은 현재 개발 중입니다.
            </Typography>
            {content.lessons && content.lessons[0] && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                예상 재생 시간: {content.lessons[0].duration}분
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 결제 다이얼로그 */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => {
          setPaymentDialogOpen(false);
          setPaymentInfo(null);
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>결제하기</DialogTitle>
        <DialogContent>
          {paymentInfo && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {content?.title}
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPaymentDialogOpen(false);
            setPaymentInfo(null);
          }}>
            취소
          </Button>
        </DialogActions>
      </Dialog>
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </>
  );
};

export default ContentDetail;
