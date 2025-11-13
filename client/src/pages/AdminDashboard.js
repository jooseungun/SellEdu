import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  AppBar,
  Toolbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pendingContents, setPendingContents] = useState([]);
  const [approvedContents, setApprovedContents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gradePolicies, setGradePolicies] = useState([]);
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [approveForm, setApproveForm] = useState({ display_order: 0, content_area: 'default' });
  const [rejectReason, setRejectReason] = useState('');
  const [orderForm, setOrderForm] = useState({});

  useEffect(() => {
    fetchData();
  }, [tabValue]);

  const fetchData = async () => {
    try {
      if (tabValue === 0) {
        const response = await api.get('/admin/contents/pending');
        setPendingContents(response.data || []);
      } else if (tabValue === 1) {
        const response = await api.get('/admin/contents/approved');
        setApprovedContents(response.data || []);
      } else if (tabValue === 2) {
        const response = await api.get('/admin/reviews');
        setReviews(response.data || []);
      } else if (tabValue === 3) {
        const response = await api.get('/admin/grade-policies');
        setGradePolicies(response.data || []);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post(`/admin/contents/${selectedContent.id}/approve`, approveForm);
      alert('콘텐츠가 승인되었습니다.');
      setApproveDialogOpen(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '승인에 실패했습니다.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('미승인 사유를 입력해주세요.');
      return;
    }
    try {
      await api.post(`/admin/contents/${selectedContent.id}/reject`, { reason: rejectReason });
      alert('콘텐츠가 거부되었습니다.');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '거부에 실패했습니다.');
    }
  };

  const handleUpdateOrder = async () => {
    try {
      await api.put('/admin/contents/order', orderForm);
      alert('정렬순서가 변경되었습니다.');
      setOrderDialogOpen(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '정렬순서 변경에 실패했습니다.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('후기를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/admin/reviews/${reviewId}`);
      alert('후기가 삭제되었습니다.');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || '후기 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{ color: 'white', mr: 2 }}
          >
            홈으로
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            관리자 대시보드
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label="콘텐츠 승인심사" />
          <Tab label="판매콘텐츠 관리" />
          <Tab label="후기 관리" />
          <Tab label="등급 정책" />
        </Tabs>

        {/* 콘텐츠 승인심사 */}
        {tabValue === 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              심사 대기 목록 {pendingContents.filter(c => c.is_reapply).length > 0 && 
                `(재심사: ${pendingContents.filter(c => c.is_reapply).length}건)`}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>제목</TableCell>
                    <TableCell>판매자</TableCell>
                    <TableCell>가격</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>
                        {content.title}
                        {content.is_reapply && (
                          <Chip label="재심사" color="warning" size="small" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>{content.seller_username}</TableCell>
                      <TableCell>{content.price?.toLocaleString()}원</TableCell>
                      <TableCell>
                        <Chip label="심사대기" color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Button
                          startIcon={<CheckCircleIcon />}
                          size="small"
                          color="success"
                          onClick={() => {
                            setSelectedContent(content);
                            setApproveForm({ display_order: content.display_order || 0, content_area: content.content_area || 'default' });
                            setApproveDialogOpen(true);
                          }}
                          sx={{ mr: 1 }}
                        >
                          승인
                        </Button>
                        <Button
                          startIcon={<CancelIcon />}
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedContent(content);
                            setRejectReason('');
                            setRejectDialogOpen(true);
                          }}
                        >
                          거부
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* 판매콘텐츠 관리 */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              판매중인 콘텐츠 관리
            </Typography>
            <Box sx={{ mb: 2 }}>
              <FormControl sx={{ minWidth: 200, mr: 2 }}>
                <InputLabel>영역별 필터</InputLabel>
                <Select
                  value="all"
                  label="영역별 필터"
                  onChange={(e) => {
                    // 필터링 로직 추가 가능
                  }}
                >
                  <MenuItem value="all">전체</MenuItem>
                  <MenuItem value="default">기본</MenuItem>
                  <MenuItem value="popular">인기</MenuItem>
                  <MenuItem value="new">신규</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>제목</TableCell>
                    <TableCell>영역</TableCell>
                    <TableCell>정렬순서</TableCell>
                    <TableCell>평점</TableCell>
                    <TableCell>후기 수</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell>{content.title}</TableCell>
                      <TableCell>{content.content_area || 'default'}</TableCell>
                      <TableCell>{content.display_order}</TableCell>
                      <TableCell>{content.avg_rating ? content.avg_rating.toFixed(1) : '-'}</TableCell>
                      <TableCell>{content.review_count || 0}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => {
                            setOrderForm({ content_id: content.id, display_order: content.display_order, content_area: content.content_area || 'default' });
                            setOrderDialogOpen(true);
                          }}
                          sx={{ mr: 1 }}
                        >
                          정렬변경
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={async () => {
                            if (!window.confirm('판매를 중지하시겠습니까?')) return;
                            try {
                              await api.post(`/admin/contents/${content.id}/suspend`);
                              alert('판매가 중지되었습니다.');
                              fetchData();
                            } catch (error) {
                              alert(error.response?.data?.error || '판매 중지에 실패했습니다.');
                            }
                          }}
                        >
                          판매중지
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* 후기 관리 */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              콘텐츠 후기 관리
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>콘텐츠</TableCell>
                    <TableCell>작성자</TableCell>
                    <TableCell>평점</TableCell>
                    <TableCell>내용</TableCell>
                    <TableCell>작성일</TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.content_title}</TableCell>
                      <TableCell>{review.buyer_username}</TableCell>
                      <TableCell>
                        <Chip label={`${review.rating}점`} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{review.comment?.substring(0, 50)}...</TableCell>
                      <TableCell>{new Date(review.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* 등급 정책 */}
        {tabValue === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              등급 정책 관리
            </Typography>
            <Box>
              {gradePolicies.map((policy) => (
                <Box key={policy.id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle1">
                    {policy.user_type} - {policy.grade_name}
                  </Typography>
                  <Typography variant="body2">
                    최소 금액: {policy.min_amount?.toLocaleString()}원
                    {policy.max_amount && ` ~ ${policy.max_amount.toLocaleString()}원`}
                  </Typography>
                  {policy.user_type === 'buyer' && (
                    <Typography variant="body2">
                      할인율: {policy.discount_rate}%
                    </Typography>
                  )}
                  {policy.user_type === 'seller' && (
                    <Typography variant="body2">
                      수수료율: {policy.commission_rate}%
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* 승인 다이얼로그 */}
        <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)}>
          <DialogTitle>콘텐츠 승인</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="정렬순서"
              type="number"
              margin="normal"
              value={approveForm.display_order}
              onChange={(e) => setApproveForm({ ...approveForm, display_order: parseInt(e.target.value) })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>콘텐츠 영역</InputLabel>
              <Select
                value={approveForm.content_area}
                label="콘텐츠 영역"
                onChange={(e) => setApproveForm({ ...approveForm, content_area: e.target.value })}
              >
                <MenuItem value="default">기본</MenuItem>
                <MenuItem value="popular">인기</MenuItem>
                <MenuItem value="new">신규</MenuItem>
                <MenuItem value="recommended">추천</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveDialogOpen(false)}>취소</Button>
            <Button onClick={handleApprove} variant="contained" color="success">승인</Button>
          </DialogActions>
        </Dialog>

        {/* 거부 다이얼로그 */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
          <DialogTitle>콘텐츠 거부</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="미승인 사유"
              multiline
              rows={4}
              margin="normal"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거부 사유를 입력해주세요..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>취소</Button>
            <Button onClick={handleReject} variant="contained" color="error">거부</Button>
          </DialogActions>
        </Dialog>

        {/* 정렬순서 변경 다이얼로그 */}
        <Dialog open={orderDialogOpen} onClose={() => setOrderDialogOpen(false)}>
          <DialogTitle>정렬순서 변경</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="정렬순서"
              type="number"
              margin="normal"
              value={orderForm.display_order}
              onChange={(e) => setOrderForm({ ...orderForm, display_order: parseInt(e.target.value) })}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>콘텐츠 영역</InputLabel>
              <Select
                value={orderForm.content_area}
                label="콘텐츠 영역"
                onChange={(e) => setOrderForm({ ...orderForm, content_area: e.target.value })}
              >
                <MenuItem value="default">기본</MenuItem>
                <MenuItem value="popular">인기</MenuItem>
                <MenuItem value="new">신규</MenuItem>
                <MenuItem value="recommended">추천</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDialogOpen(false)}>취소</Button>
            <Button onClick={handleUpdateOrder} variant="contained">변경</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default AdminDashboard;
