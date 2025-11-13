import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
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
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CodeIcon from '@mui/icons-material/Code';
import LogoutIcon from '@mui/icons-material/Logout';
import api from '../utils/api';
import { getToken, removeToken } from '../utils/auth';

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

  useEffect(() => {
    // 로그인 체크
    if (!getToken()) {
      navigate('/login?from=/seller');
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
      
      // 배열인지 확인하고 안전하게 설정
      let contentsData = contentsRes.data;
      let contentsArray = Array.isArray(contentsData) ? contentsData : [];
      
      // 콘텐츠가 없으면 자동으로 seed-contents 호출 (joosu 계정으로 생성)
      if (contentsArray.length === 0) {
        try {
          console.log('판매자 콘텐츠가 없어 자동 생성 중...');
          const seedResponse = await api.post('/admin/seed-contents');
          console.log('콘텐츠 데이터 생성 결과:', seedResponse.data);
          // seed 후 다시 조회
          const retryResponse = await api.get('/contents/seller/list');
          contentsData = retryResponse.data;
          contentsArray = Array.isArray(contentsData) ? contentsData : [];
          console.log('생성된 콘텐츠 수:', contentsArray.length);
        } catch (seedError) {
          console.error('콘텐츠 데이터 생성 실패:', seedError);
          // seed 실패해도 한 번 더 조회 시도
          try {
            const retryResponse = await api.get('/contents/seller/list');
            contentsData = retryResponse.data;
            contentsArray = Array.isArray(contentsData) ? contentsData : [];
          } catch (retryError) {
            console.error('재조회 실패:', retryError);
          }
        }
      }
      
      setContents(contentsArray);
      
      // 정산 내역도 안전하게 처리
      const settlementsData = settlementsRes.data?.histories || settlementsRes.data || [];
      const settlementsArray = Array.isArray(settlementsData) ? settlementsData : [];
      setSettlements(settlementsArray);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      // 프로토타입: API 실패 시 빈 배열로 설정하여 화면은 표시
      setContents([]);
      setSettlements([]);
      // API 에러는 콘솔에만 기록하고 빈 데이터로 표시
      console.error('API 호출 실패:', error);
      
      // 403 에러인 경우 판매자 권한이 없다는 메시지
      if (error.response?.status === 403) {
        setError('판매자 권한이 필요합니다. 관리자에게 문의하세요.');
      }
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
      cdn_link: content.cdn_link,
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
      return <Chip label="재심사" color="warning" size="small" />;
    }
    const statusMap = {
      'pending': { label: '심사대기', color: 'warning' },
      'approved': { label: '판매중', color: 'success' },
      'rejected': { label: '거부됨', color: 'error' },
      'suspended': { label: '판매중지', color: 'default' }
    };
    const statusInfo = statusMap[status] || { label: status, color: 'default' };
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

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
            sx={{ color: 'white', mr: 1 }}
          >
            API 가이드
          </Button>
          <Button
            startIcon={<LogoutIcon />}
            onClick={() => {
              removeToken();
              navigate('/');
            }}
            sx={{ color: 'white' }}
          >
            로그아웃
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="판매 현황" />
            <Tab label="내 콘텐츠 관리" />
            <Tab label="정산 내역" />
          </Tabs>
          <Button
            variant="contained"
            onClick={() => navigate('/seller/apply')}
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}
          >
            심사 신청
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>

        {tabValue === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              판매 현황 대시보드
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                총 판매 콘텐츠: {contents.filter(c => c.status === 'approved').length}개
              </Typography>
              <Typography variant="body1">
                총 판매액: {contents.reduce((sum, c) => sum + (parseFloat(c.total_sales) || 0), 0).toLocaleString()}원
              </Typography>
              {contents.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  아직 등록된 콘텐츠가 없습니다. "심사 신청" 버튼을 클릭하여 콘텐츠를 등록하세요.
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              내 콘텐츠 현황
            </Typography>
            {contents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  등록된 콘텐츠가 없습니다.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/seller/apply')}
                  sx={{ mt: 2 }}
                >
                  콘텐츠 심사 신청하기
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>제목</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>가격</TableCell>
                      <TableCell>구매 수</TableCell>
                      <TableCell>총 판매액</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>{content.title}</TableCell>
                      <TableCell>
                        {getStatusChip(content.status, content.is_reapply)}
                        {content.rejection_reason && (
                          <Typography variant="caption" color="error" display="block">
                            사유: {content.rejection_reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{content.price?.toLocaleString()}원</TableCell>
                      <TableCell>{content.purchase_count || 0}</TableCell>
                      <TableCell>{content.total_sales?.toLocaleString() || 0}원</TableCell>
                      <TableCell>
                        {(content.status === 'approved' || content.status === 'rejected') && (
                          <Button
                            startIcon={<EditIcon />}
                            size="small"
                            onClick={() => handleEditClick(content)}
                          >
                            수정/재심사
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              정산 내역
            </Typography>
            {settlements.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  정산 내역이 없습니다.
                </Typography>
              </Box>
            ) : (
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
            )}
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
                  navigate('/seller/settlement-request', {
                    state: {
                      period_start: lastMonth.toISOString().split('T')[0],
                      period_end: lastDay.toISOString().split('T')[0]
                    }
                  });
                }}
              >
                정산 신청
              </Button>
            </Box>
          </Paper>
        )}
          </>
        )}

        {/* 콘텐츠 수정 다이얼로그 */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>콘텐츠 수정 및 재심사 신청</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="제목"
              margin="normal"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <TextField
              fullWidth
              label="설명"
              margin="normal"
              multiline
              rows={4}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
            <TextField
              fullWidth
              label="썸네일 URL"
              margin="normal"
              value={editForm.thumbnail_url}
              onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })}
            />
            <TextField
              fullWidth
              label="CDN 링크"
              margin="normal"
              value={editForm.cdn_link}
              onChange={(e) => setEditForm({ ...editForm, cdn_link: e.target.value })}
            />
            <TextField
              fullWidth
              label="가격"
              type="number"
              margin="normal"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            />
            <TextField
              fullWidth
              label="태그 (쉼표로 구분)"
              margin="normal"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>취소</Button>
            <Button onClick={handleEditSubmit} variant="contained">수정 및 재심사 신청</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default SellerDashboard;
