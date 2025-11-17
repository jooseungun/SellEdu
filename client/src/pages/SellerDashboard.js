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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import CodeIcon from '@mui/icons-material/Code';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import api from '../utils/api';
import { getToken, removeToken, getUserName } from '../utils/auth';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rejectionReasonDialogOpen, setRejectionReasonDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnershipDialogOpen, setPartnershipDialogOpen] = useState(false);
  const [hasPartnershipRequest, setHasPartnershipRequest] = useState(false);
  const [partnershipType, setPartnershipType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // 로그인 체크
    const checkAuth = async () => {
      const token = getToken();
      console.log('SellerDashboard - Token check:', !!token);
      console.log('SellerDashboard - Token value:', token ? token.substring(0, 50) + '...' : 'null');
      
      if (!token) {
        console.log('SellerDashboard - No token, redirecting to login');
        navigate('/login?from=/seller', { replace: true });
        return;
      }
      
      // 사용자 정보 확인
      try {
        const name = getUserName();
        console.log('SellerDashboard - User name:', name);
        setUserName(name || '');
        
        // 사용자 정보가 없으면 토큰이 유효하지 않을 수 있음
        if (!name) {
          console.warn('SellerDashboard - User name is empty, token might be invalid');
        }
      } catch (error) {
        console.error('SellerDashboard - Error getting user name:', error);
        // 토큰이 있지만 디코딩 실패 시에도 페이지는 표시
        setUserName('');
      }
      
      // 토큰이 있으면 데이터 로드 시도
      fetchData();
    };
    
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contentsRes = await api.get('/contents/seller/list');
      
      // 배열인지 확인하고 안전하게 설정
      let contentsData = contentsRes.data;
      let contentsArray = Array.isArray(contentsData) ? contentsData : [];
      
      console.log('판매자 콘텐츠 조회 결과:', contentsArray.length, '개');
      
      setContents(contentsArray);
      
      // 정산 내역은 현재 미구현
      setSettlements([]);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      console.error('Error response:', error.response);
      
      // 401 에러인 경우 토큰이 유효하지 않거나 만료됨
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || '인증이 필요합니다. 다시 로그인해주세요.';
        setError(errorMessage);
        // 토큰 제거하고 로그인 페이지로 리다이렉트
        setTimeout(() => {
          removeToken();
          navigate('/login?from=/seller');
        }, 2000);
        setContents([]);
        setSettlements([]);
      } 
      // 403 에러인 경우 판매자 권한이 없다는 메시지
      else if (error.response?.status === 403) {
        setError('판매자 권한이 필요합니다. 관리자에게 문의하세요.');
        setContents([]);
        setSettlements([]);
      }
      // 기타 에러
      else {
        // 프로토타입: API 실패 시 빈 배열로 설정하여 화면은 표시
        setContents([]);
        setSettlements([]);
        // API 에러는 콘솔에만 기록하고 빈 데이터로 표시
        console.error('API 호출 실패:', error);
        const errorMessage = error.response?.data?.error || '데이터를 불러오는데 실패했습니다.';
        if (errorMessage && !errorMessage.includes('인증')) {
          setError(errorMessage);
        }
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
      'reviewing': { label: '심사중', color: 'info' },
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
                 {userName && (
                   <Typography variant="body1" sx={{ color: 'white', mr: 2 }}>
                     {userName}님 환영합니다
                   </Typography>
                 )}
                 <Button
                   startIcon={<LocalOfferIcon />}
                   onClick={() => setPartnershipDialogOpen(true)}
                   sx={{ color: 'white', mr: 1 }}
                   disabled={hasPartnershipRequest}
                 >
                   제휴할인
                 </Button>
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
            <Tab label="내 콘텐츠 현황" />
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {getStatusChip(content.status, content.is_reapply)}
                          {content.status === 'rejected' && content.rejection_reason && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                setSelectedRejectionReason(content.rejection_reason);
                                setRejectionReasonDialogOpen(true);
                              }}
                              sx={{ 
                                mt: 0.5,
                                textTransform: 'none',
                                fontSize: '0.75rem'
                              }}
                            >
                              사유 확인
                            </Button>
                          )}
                        </Box>
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
                  // 정산 요청 기능은 현재 미구현
                  alert('정산 요청 기능은 준비 중입니다.');
                  // navigate('/seller/settlement-request', {
                  //   state: {
                  //     period_start: lastMonth.toISOString().split('T')[0],
                  //     period_end: lastDay.toISOString().split('T')[0]
                  //   }
                  // });
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

        {/* 거부 사유 확인 다이얼로그 */}
        <Dialog
          open={rejectionReasonDialogOpen}
          onClose={() => setRejectionReasonDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
            color: 'white',
            pb: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              거부 사유 확인
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                아래 사유로 콘텐츠가 거부되었습니다.
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ 
              p: 3, 
              bgcolor: 'grey.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              minHeight: 150
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  color: 'text.primary'
                }}
              >
                {selectedRejectionReason || '거부 사유가 없습니다.'}
              </Typography>
            </Box>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                💡 거부 사유를 확인하신 후, 콘텐츠를 수정하여 재심사를 신청하실 수 있습니다.
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={() => setRejectionReasonDialogOpen(false)}
              variant="contained"
              color="primary"
              size="large"
              fullWidth
            >
              확인
            </Button>
          </DialogActions>
        </Dialog>

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
      </Container>
    </>
  );
};

export default SellerDashboard;
