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
  Tabs,
  Tab,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../utils/api';
import { getToken, removeToken } from '../utils/auth';

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
    thumbnail_url: `https://picsum.photos/300/400?random=${index + 1}`,
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
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  useEffect(() => {
    fetchContents();
  }, []);

  // 프로토타입: 초기 로드 시 가비지 데이터 설정
  useEffect(() => {
    if (contents.length === 0 && !loading) {
      const mockData = generateMockContents();
      setContents(mockData);
    }
  }, [loading, contents.length]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contents', {
        params: { search }
      });
      const data = response.data.contents || response.data || [];
      setContents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('콘텐츠 목록 조회 실패:', error);
      // 프로토타입: 가비지 데이터 사용
      const mockData = generateMockContents();
      setContents(mockData);
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
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
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
            구매자 페이지
          </Typography>
          <Button
            startIcon={<SubscriptionsIcon />}
            onClick={() => navigate('/buyer/subscription')}
            sx={{ color: 'white', mr: 1 }}
          >
            구독
          </Button>
          <Button
            startIcon={<CodeIcon />}
            onClick={() => navigate('/buyer/api-guide')}
            sx={{ color: 'white', mr: 1 }}
          >
            API 가이드
          </Button>
          {isLoggedIn ? (
            <Button
              startIcon={<LogoutIcon />}
              onClick={() => {
                removeToken();
                setIsLoggedIn(false);
                navigate('/');
              }}
              sx={{ color: 'white' }}
            >
              로그아웃
            </Button>
          ) : (
            <Button
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{ color: 'white' }}
            >
              로그인
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: '#1a1a1a', minHeight: '100vh', pb: 4 }}>
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)} 
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                color: 'white',
                '&.Mui-selected': {
                  color: '#667eea'
                }
              }
            }}
          >
            <Tab label="전체 콘텐츠" />
            <Tab label="구독 콘텐츠" />
          </Tabs>

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
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#2a2a2a',
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.3)'
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255,255,255,0.5)'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea'
                  }
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255,255,255,0.5)'
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
                    bgcolor: selectedCategory === category ? '#667eea' : 'rgba(255,255,255,0.1)',
                    color: 'white',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: selectedCategory === category ? '#667eea' : 'rgba(255,255,255,0.2)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : (
            <>
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  {filteredContents.length === 0 ? (
                    <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        콘텐츠가 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    filteredContents.map((content, index) => (
                      <Grid item xs={6} sm={4} md={3} lg={2.4} key={content.id || index}>
                        <Card
                          sx={{
                            bgcolor: '#2a2a2a',
                            color: 'white',
                            position: 'relative',
                            transition: 'transform 0.2s',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              zIndex: 1
                            }
                          }}
                          onClick={() => navigate(`/content/${content.id}`)}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <CardMedia
                              component="img"
                              height="240"
                              image={content.thumbnail_url || 'https://via.placeholder.com/300x400'}
                              alt={content.title}
                              sx={{ objectFit: 'cover' }}
                            />
                            {/* 오버레이 정보 */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                p: 1.5,
                                opacity: 0,
                                transition: 'opacity 0.2s',
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
                                fontWeight: 'bold',
                                color: 'white',
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
                                color: 'rgba(255,255,255,0.7)',
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
                              {content.price > 0 ? (
                                <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 'bold' }}>
                                  {content.price.toLocaleString()}원
                                </Typography>
                              ) : (
                                <Chip
                                  label="구독"
                                  size="small"
                                  sx={{
                                    bgcolor: '#4CAF50',
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                              )}
                              {content.avg_rating && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
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

              {tabValue === 1 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    구독 콘텐츠
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    구독 콘텐츠는 구독 페이지에서 확인할 수 있습니다.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/buyer/subscription')}
                    sx={{
                      mt: 2,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    구독 페이지로 이동
                  </Button>
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
};

export default BuyerHome;
