import React, { useState, useEffect } from 'react';
import { 
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  TextField,
  Box,
  AppBar,
  Toolbar,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Rating
} from '@mui/material'; // Fixed duplicate TextField import
import { useNavigate } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import api from '../utils/api';
import { getToken, removeToken, getUserName } from '../utils/auth';
import UserProfileDialog from '../components/UserProfileDialog';
import { getThumbnailUrl } from '../utils/thumbnail';

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

// 더미 데이터 생성 함수 제거됨 - 실제 DB 데이터만 사용
const BuyerHome = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnershipDialogOpen, setPartnershipDialogOpen] = useState(false);
  const [partnershipType, setPartnershipType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hasPartnershipRequest, setHasPartnershipRequest] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [buyerInfo, setBuyerInfo] = useState(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [purchases, setPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    if (token) {
      setUserName(getUserName());
      fetchCartCount();
      fetchBuyerInfo();
      // 주기적으로 장바구니 개수 업데이트 (30초마다)
      const interval = setInterval(fetchCartCount, 30000);
      return () => clearInterval(interval);
    } else {
      setCartItemCount(0);
    }
  }, []);

  const fetchBuyerInfo = async () => {
    if (!getToken()) {
      console.log('BuyerHome - No token, skipping buyer info fetch');
      return;
    }
    try {
      console.log('BuyerHome - Fetching buyer info...');
      const response = await api.get('/buyer/info');
      console.log('BuyerHome - Buyer info response:', response.data);
      setBuyerInfo(response.data);
    } catch (error) {
      console.error('구매자 정보 조회 실패:', error);
      // 에러가 발생해도 계속 진행 (할인율이 0으로 처리됨)
      setBuyerInfo({ discount_rate: 0, grade: 'BRONZE' });
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await api.get('/cart/count');
      setCartItemCount(response.data.count || 0);
    } catch (error) {
      // 에러가 발생해도 무시 (로그인하지 않은 경우 등)
      setCartItemCount(0);
    }
  };

  const fetchPurchases = async () => {
    if (!getToken()) {
      return;
    }
    setPurchasesLoading(true);
    try {
      const response = await api.get('/buyer/purchases');
      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('구매 내역 조회 실패:', error);
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const fetchUserReviews = async () => {
    if (!getToken()) {
      return;
    }

    try {
      const response = await api.get('/reviews');
      setUserReviews(response.data.reviews || []);
    } catch (error) {
      console.error('후기 조회 실패:', error);
    }
  };

  const handleReviewClick = (purchase) => {
    // 이미 작성한 후기가 있는지 확인
    const existingReview = userReviews.find(r => r.content_id === purchase.content_id);
    if (existingReview) {
      alert('이미 이 콘텐츠에 대한 후기를 작성하셨습니다.');
      return;
    }
    setSelectedPurchase(purchase);
    setReviewRating(0);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewRating) {
      alert('평점을 선택해주세요.');
      return;
    }

    if (!selectedPurchase) {
      return;
    }

    setReviewSubmitting(true);
    try {
      await api.post('/reviews/create', {
        content_id: selectedPurchase.content_id,
        rating: reviewRating,
        comment: reviewComment
      });
      alert('후기가 작성되었습니다.');
      setReviewDialogOpen(false);
      fetchUserReviews();
      fetchPurchases(); // 구매 내역 새로고침
    } catch (error) {
      console.error('후기 작성 실패:', error);
      alert(error.response?.data?.error || '후기 작성에 실패했습니다.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    fetchContents();
    if (isLoggedIn) {
      fetchPurchases();
      fetchUserReviews();
    }
  }, [search, selectedCategory, isLoggedIn]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contents', {
        params: { 
          search,
          category: selectedCategory !== '전체' ? selectedCategory : ''
        }
      });
      const data = response.data?.contents || response.data || [];
      let contentsData = Array.isArray(data) ? data : [];
      
      // 데이터가 없으면 자동으로 seed-contents 호출
      if (contentsData.length === 0 && !search) {
        try {
          const seedResponse = await api.post('/admin/seed-contents');
          // seed 후 다시 조회 (skipped여도 다시 조회)
          const retryResponse = await api.get('/contents', {
            params: { 
              search,
              category: selectedCategory !== '전체' ? selectedCategory : ''
            }
          });
          contentsData = retryResponse.data?.contents || retryResponse.data || [];
          console.log('콘텐츠 데이터 생성/조회 완료:', contentsData.length, '개');
        } catch (seedError) {
          console.error('콘텐츠 데이터 생성 실패:', seedError);
          // seed 실패해도 한 번 더 조회 시도
          try {
            const retryResponse = await api.get('/contents', {
              params: { 
                search,
                category: selectedCategory !== '전체' ? selectedCategory : ''
              }
            });
            contentsData = retryResponse.data?.contents || retryResponse.data || [];
          } catch (retryError) {
            console.error('재조회 실패:', retryError);
          }
        }
      }
      
      setContents(Array.isArray(contentsData) ? contentsData : []);
    } catch (error) {
      console.error('콘텐츠 목록 조회 실패:', error);
      // 에러 발생 시 빈 배열로 설정
      setContents([]);
    } finally {
      setLoading(false);
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

  const categories = [
    '전체', '인문교양', '전문직무', '공통직무', '자격증', 'IT', 
    '외국어', '어학', '경영직무', '법정교육', '직무', '산업기술지식', '경영일반'
  ];
  const filteredContents = selectedCategory === '전체' 
    ? contents 
    : contents.filter(c => c.category === selectedCategory);

  return (
    <>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            onClick={() => navigate('/')}
            sx={{
              flexGrow: 0,
              mr: 3,
              cursor: 'pointer',
              fontWeight: 700,
              userSelect: 'none',
              color: 'white',
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            🎓 SellEdu
          </Typography>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white', fontWeight: 600 }}>
            콘텐츠 구매 (구매 기업)
          </Typography>
          {isLoggedIn && userName && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mr: 2, fontWeight: 500 }}>
              {userName}님 환영합니다
            </Typography>
          )}
          {isLoggedIn && (
            <>
              <IconButton
                onClick={() => navigate('/cart')}
                sx={{ 
                  color: 'white', 
                  mr: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <Badge badgeContent={cartItemCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <IconButton
                onClick={() => setProfileDialogOpen(true)}
                sx={{ 
                  color: 'white', 
                  mr: 1,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
                title="정보 변경"
              >
                <SettingsIcon />
              </IconButton>
            </>
          )}
            <Button
              startIcon={<LocalOfferIcon />}
              onClick={() => setPartnershipDialogOpen(true)}
              sx={{ 
                color: 'white', 
                mr: 1,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
              disabled={hasPartnershipRequest}
            >
              제휴할인
            </Button>
            {isLoggedIn ? (
              <Button
                startIcon={<LogoutIcon />}
                onClick={() => {
                  removeToken();
                  setIsLoggedIn(false);
                  navigate('/');
                }}
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                로그아웃
              </Button>
            ) : (
              <Button
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                variant="outlined"
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                로그인
              </Button>
            )}
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', pb: 4 }}>
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          {/* 탭 메뉴 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => {
              setTabValue(newValue);
              if (newValue === 1) {
                fetchPurchases();
              }
            }}>
              <Tab icon={<CodeIcon />} iconPosition="start" label="콘텐츠 목록" />
              <Tab icon={<ShoppingBagIcon />} iconPosition="start" label="내 구매 내역" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <>
              {/* 검색 및 카테고리 필터 */}
              <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              placeholder="콘텐츠 검색"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchContents();
                }
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                )
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'white',
                  color: 'text.primary',
                  '& fieldset': {
                    borderColor: 'rgba(0,0,0,0.1)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main'
                  }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'text.secondary'
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  onClick={() => setSelectedCategory(category)}
                  sx={{
                    bgcolor: selectedCategory === category ? 'primary.main' : 'white',
                    color: selectedCategory === category ? 'white' : 'text.primary',
                    cursor: 'pointer',
                    border: selectedCategory === category ? 'none' : '1px solid rgba(0,0,0,0.1)',
                    fontWeight: selectedCategory === category ? 600 : 500,
                    '&:hover': {
                      bgcolor: selectedCategory === category ? 'primary.dark' : 'grey.100',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: 'primary.main' }} />
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {filteredContents.length === 0 ? (
                  <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      콘텐츠가 없습니다.
                    </Typography>
                  </Box>
                ) : (
                  filteredContents.map((content, index) => (
                      <Grid item xs={6} sm={4} md={3} lg={2.4} key={content.id || index}>
                        <Card
                          sx={{
                            bgcolor: 'white',
                            color: 'text.primary',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'translateY(-8px)',
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                              zIndex: 1
                            }
                          }}
                          onClick={() => navigate(`/content/${content.id}`)}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="240"
                              image={getThumbnailUrl(content.thumbnail_url)}
                              alt={content.title}
                              sx={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = getThumbnailUrl();
                              }}
                            />
                            {/* 오버레이 정보 */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(99, 102, 241, 0.9)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                p: 1.5,
                                opacity: 0,
                                transition: 'opacity 0.3s',
                                '&:hover': {
                                  opacity: 1
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Chip
                                  label={content.grade}
                                  size="small"
                                  sx={{
                                    bgcolor: getGradeColor(content.grade),
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                                {content.age !== 'All' && (
                                  <Chip
                                    label={content.age}
                                    size="small"
                                    sx={{
                                      bgcolor: '#f5576c',
                                      color: 'white',
                                      fontWeight: 'bold'
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/content/${content.id}`);
                                  }}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                  }}
                                >
                                  <PlayArrowIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/content/${content.id}`);
                                  }}
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                                  }}
                                >
                                  <InfoIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                mb: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {content.title}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1,
                                minHeight: '32px'
                              }}
                            >
                              {stripHtmlTags(content.description)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                              {content.price > 0 ? (() => {
                                const discountRate = buyerInfo?.discount_rate || 0;
                                const discountAmount = Math.floor(content.price * discountRate / 100);
                                const finalPrice = content.price - discountAmount;
                                const hasDiscount = discountRate > 0 && discountAmount > 0;

                                // 디버깅 로그
                                if (content.id === 1) {
                                  console.log('BuyerHome - Price display:', {
                                    contentId: content.id,
                                    price: content.price,
                                    buyerInfo,
                                    discountRate,
                                    discountAmount,
                                    finalPrice,
                                    hasDiscount
                                  });
                                }

                                return (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {hasDiscount ? (
                                      <>
                                        <Typography 
                                          variant="caption" 
                                          sx={{ 
                                            textDecoration: 'line-through',
                                            color: 'text.secondary',
                                            fontSize: '0.75rem'
                                          }}
                                        >
                                          {content.price.toLocaleString()}원
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700, fontSize: '1rem' }}>
                                          {finalPrice.toLocaleString()}원
                                        </Typography>
                                        <Chip 
                                          label={`${discountRate}% 할인`} 
                                          size="small"
                                          sx={{
                                            bgcolor: 'error.main',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.65rem',
                                            height: '18px',
                                            mt: 0.25
                                          }}
                                        />
                                      </>
                                    ) : (
                                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '1rem' }}>
                                        {content.price.toLocaleString()}원
                                      </Typography>
                                    )}
                                  </Box>
                                );
                              })() : (
                                <Chip
                                  label="무료"
                                  size="small"
                                  sx={{
                                    bgcolor: 'success.main',
                                    color: 'white',
                                    fontWeight: 600
                                  }}
                                />
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  ⭐ {content.avg_rating ? parseFloat(content.avg_rating).toFixed(1) : '0'}점 ({content.review_count || 0}개 리뷰)
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              </>
            )}
            </>
          )}

          {tabValue === 1 && (
            <Box>
              {purchasesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                  <CircularProgress sx={{ color: 'primary.main' }} />
                </Box>
              ) : purchases.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingBagIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    구매한 콘텐츠가 없습니다.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {purchases.map((purchase) => (
                    <Grid item xs={12} sm={6} md={4} key={purchase.id}>
                      <Card
                        sx={{
                          bgcolor: 'white',
                          transition: 'all 0.3s',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                        onClick={() => navigate(`/content/${purchase.content_id}`)}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="200"
                            image={getThumbnailUrl(purchase.thumbnail_url)}
                            alt={purchase.title}
                            sx={{ objectFit: 'cover' }}
                          />
                          <Chip
                            label={purchase.is_expired ? '만료됨' : `${purchase.remaining_days}일 남음`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: purchase.is_expired ? 'error.main' : 'success.main',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </Box>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} noWrap>
                            {purchase.title}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              구매일: {new Date(purchase.paid_date).toLocaleDateString('ko-KR')}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              만료일: {new Date(purchase.expiry_date).toLocaleDateString('ko-KR')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Chip
                              label={purchase.category}
                              size="small"
                              sx={{ bgcolor: 'primary.light', color: 'primary.main' }}
                            />
                            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                              {purchase.final_amount.toLocaleString()}원
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            {userReviews.find(r => r.content_id === purchase.content_id) ? (
                              <Chip
                                label="후기 작성 완료"
                                size="small"
                                sx={{ bgcolor: 'success.main', color: 'white' }}
                              />
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReviewClick(purchase);
                                }}
                                sx={{ textTransform: 'none' }}
                              >
                                후기 작성
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* 제휴할인 신청 다이얼로그 */}
      <Dialog
        open={partnershipDialogOpen}
        onClose={() => setPartnershipDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>제휴할인 신청</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset" fullWidth sx={{ mt: 2 }}>
            <FormLabel component="legend">제휴사 선택</FormLabel>
            <RadioGroup
              value={partnershipType}
              onChange={(e) => setPartnershipType(e.target.value)}
            >
              <FormControlLabel
                value="malgn"
                control={<Radio />}
                label="맑은소프트 이용고객 - 30% 할인"
                disabled={hasPartnershipRequest}
              />
            </RadioGroup>
          </FormControl>
          {partnershipType && (
            <TextField
              fullWidth
              label="고객사 명"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              margin="normal"
              disabled={hasPartnershipRequest}
            />
          )}
          {hasPartnershipRequest && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                심사중입니다. 심사 완료 후 적용됩니다.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartnershipDialogOpen(false)}>취소</Button>
          <Button
            onClick={async () => {
              if (!partnershipType || !companyName) {
                alert('제휴사를 선택하고 고객사 명을 입력해주세요.');
                return;
              }
              try {
                await api.post('/partnership/apply', {
                  type: partnershipType,
                  company_name: companyName
                });
                alert('제휴할인 신청이 완료되었습니다. 관리자 승인 후 적용됩니다.');
                setHasPartnershipRequest(true);
                setPartnershipDialogOpen(false);
              } catch (error) {
                alert('신청에 실패했습니다.');
              }
            }}
            variant="contained"
            disabled={hasPartnershipRequest}
          >
            신청
          </Button>
        </DialogActions>
      </Dialog>
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />

      {/* 후기 작성 다이얼로그 */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>후기 작성</DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedPurchase.title}
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  평점
                </Typography>
                <Rating
                  value={reviewRating}
                  onChange={(e, newValue) => setReviewRating(newValue || 0)}
                  size="large"
                />
              </Box>
              <TextField
                fullWidth
                label="후기 내용 (선택사항)"
                multiline
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="콘텐츠에 대한 후기를 작성해주세요."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>취소</Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={reviewSubmitting || !reviewRating}
          >
            {reviewSubmitting ? '작성 중...' : '작성하기'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BuyerHome;
