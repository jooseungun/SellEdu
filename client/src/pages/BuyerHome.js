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
  FormLabel
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
import Badge from '@mui/material/Badge';
import api from '../utils/api';
import { getToken, removeToken, getUserName } from '../utils/auth';

// 가비지 데이터 생성 함수
const generateMockContents = () => {
  const categories = [
    '인문교양', '전문직무', '공통직무', '자격증', 'IT', '외국어', 
    '어학', '경영직무', '법정교육', '직무', '산업기술지식', '경영일반'
  ];
  const grades = ['베이직', '프리미엄', '스탠다드', '개별구매'];
  const ages = ['All', '15', '18'];
  
  const titles = [
    '프로젝트 관리 실무', '데이터 분석 기초', 'Python 프로그래밍', '영어 회화 초급', '토익 700점 달성',
    '경영 전략 수립', '마케팅 기초', '인사 관리 실무', '회계 원리', '세무 실무',
    '정보보안 기초', '클라우드 컴퓨팅', '웹 개발 입문', '데이터베이스 설계', '네트워크 기초',
    '인문학 특강', '문학 감상법', '역사 이해', '철학 입문', '예술 감상',
    '자격증 준비반', '공인중개사', '회계사', '변호사', '의사',
    '산업기술 특강', '4차 산업혁명', 'AI 기초', '빅데이터 분석', '블록체인 이해'
  ];
  
  const descriptions = [
    '실무에서 바로 활용할 수 있는 프로젝트 관리 방법론을 학습합니다.',
    '데이터 분석의 기초부터 고급 기법까지 체계적으로 배웁니다.',
    'Python 프로그래밍 언어의 기초부터 실전 프로젝트까지 진행합니다.',
    '일상 회화부터 비즈니스 영어까지 단계별로 학습합니다.',
    '토익 700점 달성을 위한 체계적인 학습 커리큘럼입니다.',
    '경영 전략 수립의 이론과 실무를 함께 학습합니다.',
    '마케팅의 기초 개념부터 디지털 마케팅까지 다룹니다.',
    '인사 관리의 실무 노하우를 배웁니다.',
    '회계의 기본 원리를 이해하고 실무에 적용합니다.',
    '세무 실무의 핵심을 학습합니다.',
    '정보보안의 기초 개념과 실무를 학습합니다.',
    '클라우드 컴퓨팅의 개념과 활용 방법을 배웁니다.',
    '웹 개발의 기초부터 실전 프로젝트까지 진행합니다.',
    '데이터베이스 설계의 원리와 실무를 학습합니다.',
    '네트워크의 기초 개념을 이해합니다.',
    '인문학적 사고를 기르는 특강입니다.',
    '문학 작품을 깊이 있게 감상하는 방법을 배웁니다.',
    '역사를 통해 현재를 이해합니다.',
    '철학의 기본 개념을 이해합니다.',
    '예술 작품을 감상하는 방법을 배웁니다.',
    '자격증 취득을 위한 체계적인 준비 과정입니다.',
    '공인중개사 자격증 취득을 위한 강의입니다.',
    '회계사 자격증 취득을 위한 강의입니다.',
    '변호사 자격증 취득을 위한 강의입니다.',
    '의사 국가고시 준비를 위한 강의입니다.',
    '산업기술의 최신 동향을 학습합니다.',
    '4차 산업혁명의 핵심 기술을 이해합니다.',
    '인공지능의 기초 개념을 학습합니다.',
    '빅데이터 분석 방법을 배웁니다.',
    '블록체인 기술의 원리와 활용을 이해합니다.'
  ];

  return titles.map((title, index) => ({
    id: index + 1,
    title,
    description: descriptions[index] || descriptions[0],
    thumbnail_url: null, // 기본 썸네일 사용
    price: [9900, 14900, 19900, 24900, 29900, 0][index % 6],
    category: categories[index % categories.length],
    grade: grades[index % grades.length],
    age: ages[index % ages.length],
    purchase_count: Math.floor(Math.random() * 100),
    avg_rating: (Math.random() * 2 + 3).toFixed(1),
    review_count: Math.floor(Math.random() * 50),
    duration: [60, 90, 120, 150][index % 4]
  }));
};

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

  useEffect(() => {
    fetchContents();
  }, [search, selectedCategory]);

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
                              image="/default-thumbnail.svg"
                              alt={content.title}
                              sx={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = '/default-thumbnail.svg';
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
                              {content.description}
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
                              {content.avg_rating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    ⭐ {content.avg_rating}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              )}

            </>
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
              <FormControlLabel
                value="hula"
                control={<Radio />}
                label="훌라로 이용고객 +150% 할인"
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
    </>
  );
};

export default BuyerHome;
