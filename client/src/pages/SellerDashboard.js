import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Button,
  Box,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import InfoIcon from '@mui/icons-material/Info';
import api from '../utils/api';
import { getToken } from '../utils/auth';

// 가비지 데이터 생성 함수
const generateMockContents = () => {
  const categories = ['로맨스', '액션', '드라마', '코미디', '스릴러', '판타지'];
  const grades = ['베이직', '프리미엄', '스탠다드', '개별구매'];
  const ages = ['All', '15', '18'];
  const statuses = ['approved', 'pending', 'rejected'];
  
  const titles = [
    '러브 스토리', '마약상', '김진행', '고래의 꿈', '발렌타인 스위트 데이',
    '윈터', '인피니트', '시네마', '고질라 X 콩', '듄 파트 2',
    '시민덕희', '나폴레옹', '노량', '엘리멘탈', '멜로가 체질',
    '라라랜드', '플라워 가든', '더 선샤인', '마이러브 섬머'
  ];
  
  const descriptions = [
    '조금씩 마주하게 된 삶들... 잊혀져 몰랐던 삶들이 그려진다.',
    '간략 설명글이 노출됩니다. 어느 정도까지 적어야 할까요. 오늘도 하루가 지나가고 있습니다.',
    '황홀한 사랑, 순수한 희망, 격렬한 열정… 이 곳에서 모든 감정이 폭발한다!',
    '소니 픽처스에서 배급하는 리들리 스콧 감독의 영화. 나폴레옹 보나파르트의 일생을 그리는 영화이다.',
    '간략설명'
  ];

  return titles.map((title, index) => ({
    id: index + 1,
    title,
    description: descriptions[index % descriptions.length],
    thumbnail_url: `https://picsum.photos/300/400?random=${index + 1}`,
    price: [9900, 14900, 19900, 24900, 29900][index % 5],
    status: statuses[index % statuses.length],
    category: categories[index % categories.length],
    grade: grades[index % grades.length],
    age: ages[index % ages.length],
    purchase_count: Math.floor(Math.random() * 100),
    total_sales: Math.floor(Math.random() * 1000000),
    avg_rating: (Math.random() * 2 + 3).toFixed(1),
    review_count: Math.floor(Math.random() * 50),
    duration: [60, 90, 120, 150][index % 4],
    is_reapply: false,
    rejection_reason: null
  }));
};

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  useEffect(() => {
    if (!getToken()) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contentsRes, settlementsRes] = await Promise.all([
        api.get('/contents/seller/list'),
        api.get('/seller/settlement')
      ]);
      
      const contentsData = contentsRes.data;
      const contentsArray = Array.isArray(contentsData) ? contentsData : [];
      setContents(contentsArray);
      
      const settlementsData = settlementsRes.data?.histories || settlementsRes.data || [];
      const settlementsArray = Array.isArray(settlementsData) ? settlementsData : [];
      setSettlements(settlementsArray);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      // 프로토타입: 가비지 데이터 사용
      setContents(generateMockContents());
      setSettlements([]);
      setError('프로토타입 버전: 백엔드 서버가 연결되지 않았습니다. 가비지 데이터를 표시합니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (content) => {
    setSelectedContent(content);
    setEditForm({
      title: content.title,
      description: content.description,
      thumbnail_url: content.thumbnail_url,
      cdn_link: content.cdn_link || '',
      price: content.price,
      duration: content.duration,
      tags: Array.isArray(content.tags) ? content.tags.join(', ') : '',
      sale_start_date: content.sale_start_date || '',
      sale_end_date: content.sale_end_date || '',
      is_always_on_sale: content.is_always_on_sale || false
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/contents/${selectedContent.id}`, {
        ...editForm,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      alert('콘텐츠가 수정되었고 재심사 신청이 완료되었습니다.');
      setEditDialogOpen(false);
      fetchData();
    } catch (error) {
      alert('프로토타입 버전: 실제 수정 처리는 되지 않습니다.');
      setEditDialogOpen(false);
    }
  };

  const getStatusChip = (status, isReapply) => {
    if (status === 'pending' && isReapply) {
      return <Chip label="재심사" color="warning" size="small" sx={{ mb: 0.5 }} />;
    }
    const statusMap = {
      'pending': { label: '심사대기', color: 'warning' },
      'approved': { label: '판매중', color: 'success' },
      'rejected': { label: '거부됨', color: 'error' },
      'suspended': { label: '판매중지', color: 'default' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ mb: 0.5 }} />;
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

  const categories = ['전체', '로맨스', '액션', '드라마', '코미디', '스릴러', '판타지'];
  const filteredContents = selectedCategory === '전체' 
    ? contents 
    : contents.filter(c => c.category === selectedCategory);

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
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
            판매자 대시보드
          </Typography>
          <Button
            startIcon={<CodeIcon />}
            onClick={() => navigate('/seller/api-guide')}
            sx={{ color: 'white', mr: 2 }}
          >
            API 가이드
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/seller/apply')}
            sx={{
              background: 'rgba(255,255,255,0.2)',
              '&:hover': {
                background: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            심사 신청
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ bgcolor: '#1a1a1a', minHeight: '100vh', pb: 4 }}>
        <Container maxWidth="xl" sx={{ pt: 4 }}>
          {error && (
            <Alert severity="info" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, v) => setTabValue(v)}
              sx={{
                '& .MuiTab-root': {
                  color: 'white',
                  '&.Mui-selected': {
                    color: '#f5576c'
                  }
                }
              }}
            >
              <Tab label="내 콘텐츠" />
              <Tab label="판매 현황" />
              <Tab label="정산 내역" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: '#f5576c' }} />
            </Box>
          ) : (
            <>
              {tabValue === 0 && (
                <>
                  {/* 카테고리 필터 */}
                  <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {categories.map((category) => (
                      <Chip
                        key={category}
                        label={category}
                        onClick={() => setSelectedCategory(category)}
                        sx={{
                          bgcolor: selectedCategory === category ? '#f5576c' : 'rgba(255,255,255,0.1)',
                          color: 'white',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: selectedCategory === category ? '#f5576c' : 'rgba(255,255,255,0.2)'
                          }
                        }}
                      />
                    ))}
                  </Box>

                  {/* 콘텐츠 그리드 */}
                  {filteredContents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                        등록된 콘텐츠가 없습니다.
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/seller/apply')}
                        sx={{
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        }}
                      >
                        콘텐츠 심사 신청하기
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {filteredContents.map((content) => (
                        <Grid item xs={6} sm={4} md={3} lg={2.4} key={content.id}>
                          <Card
                            sx={{
                              bgcolor: '#2a2a2a',
                              color: 'white',
                              position: 'relative',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                zIndex: 1
                              }
                            }}
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
                                    onClick={() => handleEditClick(content)}
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
                              {/* 상태 배지 */}
                              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                {getStatusChip(content.status, content.is_reapply)}
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
                                <Typography variant="body2" sx={{ color: '#f5576c', fontWeight: 'bold' }}>
                                  {content.price?.toLocaleString()}원
                                </Typography>
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
                      ))}
                    </Grid>
                  )}
                </>
              )}

              {tabValue === 1 && (
                <Box sx={{ bgcolor: '#2a2a2a', p: 4, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    판매 현황 대시보드
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ bgcolor: '#1a1a1a', p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          총 판매 콘텐츠
                        </Typography>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {contents.filter(c => c.status === 'approved').length}개
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ bgcolor: '#1a1a1a', p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          총 판매액
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                          {contents.reduce((sum, c) => sum + (parseFloat(c.total_sales) || 0), 0).toLocaleString()}원
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ bgcolor: '#1a1a1a', p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          총 구매 수
                        </Typography>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                          {contents.reduce((sum, c) => sum + (c.purchase_count || 0), 0)}건
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ bgcolor: '#1a1a1a', p: 3, borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                          평균 평점
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#FF9800', fontWeight: 'bold' }}>
                          {contents.length > 0 
                            ? (contents.reduce((sum, c) => sum + parseFloat(c.avg_rating || 0), 0) / contents.length).toFixed(1)
                            : '0.0'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {tabValue === 2 && (
                <Box sx={{ bgcolor: '#2a2a2a', p: 4, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 3 }}>
                    정산 내역
                  </Typography>
                  {settlements.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        정산 내역이 없습니다.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ color: 'white' }}>
                      {settlements.map((settlement) => (
                        <Box key={settlement.id} sx={{ mb: 2, p: 2, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                          <Typography variant="body1">
                            {settlement.settlement_period_start} ~ {settlement.settlement_period_end}
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#4CAF50', mt: 1 }}>
                            {settlement.seller_amount?.toLocaleString()}원
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            상태: {settlement.settlement_status}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>

      {/* 콘텐츠 수정 다이얼로그 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#2a2a2a', color: 'white' }
        }}
      >
        <DialogTitle>콘텐츠 수정 및 재심사 신청</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="제목"
            margin="normal"
            value={editForm.title}
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            sx={{
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
          />
          <TextField
            fullWidth
            label="설명"
            margin="normal"
            multiline
            rows={4}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            sx={{
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
          />
          <TextField
            fullWidth
            label="썸네일 URL"
            margin="normal"
            value={editForm.thumbnail_url}
            onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
            sx={{
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
          />
          <TextField
            fullWidth
            label="가격"
            type="number"
            margin="normal"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            sx={{
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ color: 'white' }}>
            취소
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}
          >
            수정 및 재심사 신청
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SellerDashboard;
