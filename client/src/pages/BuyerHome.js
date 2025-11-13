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
import api from '../utils/api';

// 가비지 데이터 생성 함수
const generateMockContents = () => {
  const categories = ['로맨스', '액션', '드라마', '코미디', '스릴러', '판타지', '블록버스터', '강추', '프랑스'];
  const grades = ['베이직', '프리미엄', '스탠다드', '개별구매'];
  const ages = ['All', '15', '18'];
  
  const titles = [
    '러브 스토리', '마약상', '김진행', '고래의 꿈', '발렌타인 스위트 데이',
    '윈터', '인피니트', '시네마', '고질라 X 콩', '듄 파트 2',
    '시민덕희', '나폴레옹', '노량', '엘리멘탈', '멜로가 체질',
    '라라랜드', '플라워 가든', '더 선샤인', '마이러브 섬머', '러브 스토리',
    '엘리멘탈', '멜로가 체질', '라라랜드', '플라워 가든', '더 선샤인'
  ];
  
  const descriptions = [
    '조금씩 마주하게 된 삶들... 잊혀져 몰랐던 삶들이 그려진다.',
    '간략 설명글이 노출됩니다. 어느 정도까지 적어야 할까요. 오늘도 하루가 지나가고 있습니다.',
    '황홀한 사랑, 순수한 희망, 격렬한 열정… 이 곳에서 모든 감정이 폭발한다!',
    '소니 픽처스에서 배급하는 리들리 스콧 감독의 영화. 나폴레옹 보나파르트의 일생을 그리는 영화이다.',
    '간략설명',
    '간략 설명글이 노출됩니다. 어느 정도까지 적어야 할까요. 오늘도 하루가 지나가고 있습니다. 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에 러브스토리에'
  ];

  return titles.map((title, index) => ({
    id: index + 1,
    title,
    description: descriptions[index % descriptions.length],
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

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contents', {
        params: { search }
      });
      setContents(response.data.contents || []);
    } catch (error) {
      console.error('콘텐츠 목록 조회 실패:', error);
      // 프로토타입: 가비지 데이터 사용
      setContents(generateMockContents());
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

  const categories = ['전체', '로맨스', '액션', '드라마', '코미디', '스릴러', '판타지', '블록버스터', '강추', '프랑스'];
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
            sx={{ color: 'white' }}
          >
            API 가이드
          </Button>
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
                    filteredContents.map((content) => (
                      <Grid item xs={6} sm={4} md={3} lg={2.4} key={content.id}>
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
