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
  Toolbar,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import StoreIcon from '@mui/icons-material/Store';
import api from '../utils/api';
import { getToken, removeToken, isAdmin, getUserName } from '../utils/auth';
import { CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [pendingContents, setPendingContents] = useState([]);
  const [approvedContents, setApprovedContents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [gradePolicies, setGradePolicies] = useState([]);
  const [users, setUsers] = useState([]);
  const [partnershipRequests, setPartnershipRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partnershipRejectDialogOpen, setPartnershipRejectDialogOpen] = useState(false);
  const [selectedPartnershipRequest, setSelectedPartnershipRequest] = useState(null);
  const [partnershipRejectReason, setPartnershipRejectReason] = useState('');
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [contentDetailDialogOpen, setContentDetailDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [contentDetail, setContentDetail] = useState(null);
  const [approveForm, setApproveForm] = useState({ display_order: 0, content_area: 'default' });
  const [rejectReason, setRejectReason] = useState('');
  const [orderForm, setOrderForm] = useState({});
  const [newRole, setNewRole] = useState('buyer');
  const [allContents, setAllContents] = useState([]);

  useEffect(() => {
    // 로그인 체크
    if (!getToken()) {
      navigate('/login?from=/admin');
      return;
    }
    // 관리자 권한 체크
    if (!isAdmin()) {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/');
      return;
    }
    
    // 데이터베이스 초기화 확인 및 실행
    const initializeDatabase = async () => {
      try {
        // 먼저 데이터 조회 시도
        await api.get('/admin/contents/pending').catch(() => {
          // 테이블이 없으면 초기화
          throw new Error('TABLE_NOT_FOUND');
        });
        // 테이블이 있으면 정상적으로 fetchData 실행
        fetchData();
      } catch (error) {
        if (error.message === 'TABLE_NOT_FOUND' || 
            error.response?.data?.details?.includes('no such table')) {
          console.log('데이터베이스 테이블이 없어 초기화를 시작합니다...');
          try {
            const initResponse = await api.post('/admin/init-db');
            console.log('데이터베이스 초기화 완료:', initResponse.data);
            alert('데이터베이스가 초기화되었습니다. 페이지를 새로고침합니다.');
            window.location.reload();
          } catch (initError) {
            console.error('데이터베이스 초기화 실패:', initError);
            alert('데이터베이스 초기화에 실패했습니다. 관리자에게 문의하세요.');
          }
        } else {
          // 다른 에러면 그냥 fetchData 실행
          fetchData();
        }
      }
    };
    
    initializeDatabase();
  }, [tabValue, navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tabValue === 0) {
        const response = await api.get('/admin/contents/pending');
        const data = response.data || [];
        setPendingContents(Array.isArray(data) ? data : []);
      } else if (tabValue === 1) {
        // 상품관리: 모든 콘텐츠 조회 (상태 무관)
        let contentsData = [];
        try {
          const response = await api.get('/admin/contents/all');
          contentsData = response.data || [];
        } catch (error) {
          // all 엔드포인트가 없으면 approved만 조회
          try {
            const response = await api.get('/contents');
            contentsData = response.data?.contents || response.data || [];
          } catch (err) {
            console.error('콘텐츠 조회 실패:', err);
            contentsData = [];
          }
        }
        
        // 에러 응답에서 needsInit 확인
        if (contentsData.length === 0 && typeof contentsData === 'object' && contentsData.needsInit) {
          console.log('데이터베이스 초기화가 필요합니다.');
          try {
            const initResponse = await api.post('/admin/init-db');
            console.log('데이터베이스 초기화 완료:', initResponse.data);
            // 초기화 후 다시 조회
            const response = await api.get('/admin/contents/all').catch(() => 
              api.get('/contents').then(r => ({ data: r.data?.contents || r.data || [] }))
            );
            contentsData = response.data || [];
          } catch (initError) {
            console.error('데이터베이스 초기화 실패:', initError);
            setError('데이터베이스 초기화가 필요합니다. 관리자에게 문의하세요.');
          }
        }
        
        // 데이터가 없으면 자동으로 seed-contents 호출
        if (contentsData.length === 0 && Array.isArray(contentsData)) {
          try {
            console.log('콘텐츠 데이터가 없어 자동 생성 중...');
            const seedResponse = await api.post('/admin/seed-contents');
            console.log('콘텐츠 데이터 생성 결과:', seedResponse.data);
            // seed 후 다시 조회 (skipped여도 다시 조회)
            try {
              const response = await api.get('/admin/contents/all');
              contentsData = response.data || [];
              console.log('생성된 콘텐츠 수:', contentsData.length);
            } catch (err) {
              console.error('all 엔드포인트 조회 실패, approved만 조회:', err);
              const response = await api.get('/contents');
              contentsData = response.data?.contents || response.data || [];
            }
          } catch (seedError) {
            console.error('콘텐츠 데이터 생성 실패:', seedError);
            // seed 실패해도 한 번 더 조회 시도
            try {
              const response = await api.get('/admin/contents/all').catch(() => 
                api.get('/contents').then(r => ({ data: r.data?.contents || r.data || [] }))
              );
              contentsData = response.data || [];
            } catch (retryError) {
              console.error('재조회 실패:', retryError);
            }
          }
        }
        
        setAllContents(Array.isArray(contentsData) ? contentsData : []);
        
        // 기존 approvedContents도 유지 (다른 탭에서 사용)
        const approvedResponse = await api.get('/admin/contents/approved').catch(() => ({ data: [] }));
        setApprovedContents(Array.isArray(approvedResponse.data) ? approvedResponse.data : []);
      } else if (tabValue === 2) {
        const response = await api.get('/admin/reviews');
        const data = response.data || [];
        setReviews(Array.isArray(data) ? data : []);
      } else if (tabValue === 3) {
        const response = await api.get('/admin/grade-policies');
        const data = response.data || [];
        setGradePolicies(Array.isArray(data) ? data : []);
            } else if (tabValue === 4) {
              const response = await api.get('/admin/users');
              const data = response.data || [];
              setUsers(Array.isArray(data) ? data : []);
            } else if (tabValue === 5) {
              const response = await api.get('/admin/partnership/requests');
              const data = response.data || [];
              setPartnershipRequests(Array.isArray(data) ? data : []);
            }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      // 프로토타입: API 실패 시 빈 배열로 설정하여 화면은 표시
      if (tabValue === 0) {
        setPendingContents([]);
      } else if (tabValue === 1) {
        setApprovedContents([]);
      } else if (tabValue === 2) {
        setReviews([]);
      } else if (tabValue === 3) {
        setGradePolicies([]);
      } else if (tabValue === 4) {
        setUsers([]);
      }
      // API 에러는 콘솔에만 기록하고 빈 데이터로 표시
      console.error('API 호출 실패:', error);
    } finally {
      setLoading(false);
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
                 {getToken() && getUserName() && (
                   <Typography variant="body1" sx={{ color: 'white', mr: 2 }}>
                     {getUserName()}님 환영합니다
                   </Typography>
                 )}
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
        
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label="콘텐츠 승인심사" />
          <Tab label="상품관리" />
          <Tab label="후기 관리" />
          <Tab label="등급 정책" />
          <Tab label="회원 관리" />
          <Tab label="제휴할인 신청" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
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
                        <Typography
                          variant="body2"
                          sx={{
                            cursor: 'pointer',
                            color: 'primary.main',
                            fontWeight: 'bold',
                            '&:hover': {
                              textDecoration: 'underline'
                            }
                          }}
                          onClick={async () => {
                            try {
                              const response = await api.get(`/admin/contents/${content.id}/detail`);
                              setContentDetail(response.data);
                              setContentDetailDialogOpen(true);
                            } catch (error) {
                              alert('상세 정보를 불러오는데 실패했습니다.');
                            }
                          }}
                        >
                          {content.title}
                        </Typography>
                        {content.is_reapply && (
                          <Chip label="재심사" color="warning" size="small" sx={{ ml: 1, mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>{content.seller_username}</TableCell>
                      <TableCell>{content.price?.toLocaleString()}원</TableCell>
                      <TableCell>
                        {content.status === 'reviewing' ? (
                          <Chip label="심사중" color="info" size="small" />
                        ) : (
                          <Chip label="심사대기" color="warning" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={async () => {
                            try {
                              const response = await api.get(`/admin/contents/${content.id}/detail`);
                              setContentDetail(response.data);
                              setContentDetailDialogOpen(true);
                            } catch (error) {
                              alert('상세 정보를 불러오는데 실패했습니다.');
                            }
                          }}
                          sx={{ mr: 1 }}
                        >
                          상세보기
                        </Button>
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

                   {/* 상품관리 */}
                   {tabValue === 1 && (
                     <Paper sx={{ p: 3 }}>
                       <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                         <Typography variant="h6">
                           상품관리
                         </Typography>
                         <Button
                           variant="outlined"
                           size="small"
                           onClick={async () => {
                             try {
                               const response = await api.get('/admin/contents/count');
                               const data = response.data;
                               alert(
                                 `📊 콘텐츠 통계\n\n` +
                                 `전체: ${data.total}개\n\n` +
                                 `상태별:\n${data.byStatus.map((s: any) => `  ${s.status}: ${s.count}개`).join('\n')}\n\n` +
                                 `카테고리별:\n${data.byCategory.slice(0, 5).map((c: any) => `  ${c.category}: ${c.count}개`).join('\n')}\n\n` +
                                 `판매자별:\n${data.bySeller.map((s: any) => `  ${s.username || '알 수 없음'}: ${s.count}개`).join('\n')}`
                               );
                             } catch (error) {
                               console.error('통계 조회 실패:', error);
                               alert('통계를 불러오는데 실패했습니다.');
                             }
                           }}
                         >
                           통계 보기
                         </Button>
                       </Box>
                       {allContents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  등록된 상품이 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>과정명</TableCell>
                      <TableCell>카테고리</TableCell>
                      <TableCell>판매자</TableCell>
                      <TableCell>가격</TableCell>
                      <TableCell>등급</TableCell>
                      <TableCell>구매수</TableCell>
                      <TableCell>평점</TableCell>
                      <TableCell>상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allContents.map((content) => (
                      <TableRow key={content.id}>
                        <TableCell>{content.id}</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              cursor: 'pointer',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                            onClick={async () => {
                              try {
                                const response = await api.get(`/contents/${content.id}`);
                                setContentDetail(response.data);
                                setContentDetailDialogOpen(true);
                              } catch (error) {
                                alert('상세 정보를 불러오는데 실패했습니다.');
                              }
                            }}
                          >
                            {content.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={content.category} size="small" />
                        </TableCell>
                        <TableCell>{content.seller_username || '-'}</TableCell>
                        <TableCell>{content.price?.toLocaleString() || 0}원</TableCell>
                        <TableCell>
                          <Chip 
                            label={content.grade || '베이직'} 
                            size="small" 
                            color={content.grade === '프리미엄' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{content.purchase_count || 0}</TableCell>
                        <TableCell>
                          {content.avg_rating ? `${parseFloat(content.avg_rating).toFixed(1)}점` : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={content.status === 'approved' ? '승인' : content.status}
                            size="small"
                            color={content.status === 'approved' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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

        {/* 회원 관리 */}
        {tabValue === 4 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              회원 관리
            </Typography>
            {users.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  등록된 회원이 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>아이디</TableCell>
                      <TableCell>이름</TableCell>
                      <TableCell>이메일</TableCell>
                      <TableCell>휴대폰</TableCell>
                      <TableCell>역할</TableCell>
                      <TableCell>구매자 등급</TableCell>
                      <TableCell>판매자 등급</TableCell>
                      <TableCell>가입일</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.role === 'admin' && (
                              <AdminPanelSettingsIcon 
                                sx={{ color: '#f5576c', fontSize: 20 }} 
                                titleAccess="관리자"
                              />
                            )}
                            {user.role === 'seller' && (
                              <StoreIcon 
                                sx={{ color: '#667eea', fontSize: 20 }} 
                                titleAccess="판매자"
                              />
                            )}
                            {user.role === 'buyer' && (
                              <PersonIcon 
                                sx={{ color: '#4CAF50', fontSize: 20 }} 
                                titleAccess="구매자"
                              />
                            )}
                            <Typography variant="body2">{user.username}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.mobile || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.role === 'admin' ? '관리자' :
                              user.role === 'seller' ? '판매자' : '구매자'
                            }
                            size="small"
                            color={
                              user.role === 'admin' ? 'error' :
                              user.role === 'seller' ? 'primary' : 'success'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {user.buyer_grade ? (
                            <Chip label={user.buyer_grade} size="small" variant="outlined" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {user.seller_grade ? (
                            <Chip label={user.seller_grade} size="small" variant="outlined" />
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            역할 변경
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* 제휴할인 신청 관리 */}
        {tabValue === 5 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              제휴할인 신청 관리
            </Typography>
            {partnershipRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  제휴할인 신청이 없습니다.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>신청자</TableCell>
                      <TableCell>고객사 명</TableCell>
                      <TableCell>제휴사</TableCell>
                      <TableCell>상태</TableCell>
                      <TableCell>신청일</TableCell>
                      <TableCell>작업</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {partnershipRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocalOfferIcon
                              sx={{ color: '#f5576c', fontSize: 20 }}
                              titleAccess="제휴할인 신청"
                            />
                            <Typography variant="body2">{request.name || request.username}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{request.company_name}</TableCell>
                        <TableCell>
                          {request.type === 'malgn' ? '맑은소프트 (-30%)' : '훌라로 (+150%)'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              request.status === 'approved' ? '승인' :
                              request.status === 'rejected' ? '거부' :
                              request.status === 'reviewing' ? '심사중' : '대기'
                            }
                            size="small"
                            color={
                              request.status === 'approved' ? 'success' :
                              request.status === 'rejected' ? 'error' :
                              request.status === 'reviewing' ? 'info' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {request.created_at ? new Date(request.created_at).toLocaleDateString('ko-KR') : '-'}
                        </TableCell>
                        <TableCell>
                          {request.status === 'pending' || request.status === 'reviewing' ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                size="small"
                                color="success"
                                onClick={async () => {
                                  try {
                                    await api.post(`/admin/partnership/${request.id}/approve`);
                                    alert('제휴할인 신청이 승인되었습니다.');
                                    fetchData();
                                  } catch (error) {
                                    alert('승인 처리에 실패했습니다.');
                                  }
                                }}
                              >
                                승인
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedPartnershipRequest(request);
                                  setPartnershipRejectReason('');
                                  setPartnershipRejectDialogOpen(true);
                                }}
                              >
                                거부
                              </Button>
                            </Box>
                          ) : request.status === 'rejected' && request.rejection_reason ? (
                            <Typography variant="caption" color="error">
                              거부 사유: {request.rejection_reason}
                            </Typography>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}
          </>
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

        {/* 역할 변경 다이얼로그 */}
        <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
          <DialogTitle>사용자 역할 변경</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  사용자: {selectedUser.username} ({selectedUser.name})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  현재 역할: {
                    selectedUser.role === 'admin' ? '관리자' :
                    selectedUser.role === 'seller' ? '판매자' : '구매자'
                  }
                </Typography>
              </Box>
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>새로운 역할</InputLabel>
              <Select
                value={newRole}
                label="새로운 역할"
                onChange={(e) => setNewRole(e.target.value)}
              >
                <MenuItem value="buyer">구매자</MenuItem>
                <MenuItem value="seller">판매자</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRoleDialogOpen(false)}>취소</Button>
            <Button 
              onClick={async () => {
                try {
                  await api.put('/admin/users/update-role', {
                    userId: selectedUser.id,
                    role: newRole
                  });
                  alert('역할이 변경되었습니다.');
                  setRoleDialogOpen(false);
                  fetchData();
                } catch (error) {
                  alert(error.response?.data?.error || '역할 변경에 실패했습니다.');
                }
              }} 
              variant="contained"
            >
              변경
            </Button>
          </DialogActions>
        </Dialog>

        {/* 콘텐츠 상세 정보 다이얼로그 */}
        <Dialog
          open={contentDetailDialogOpen} 
          onClose={() => {
            setContentDetailDialogOpen(false);
            // 다이얼로그 닫을 때 목록 새로고침
            if (tabValue === 0) {
              fetchData();
            }
          }}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            pb: 2
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                콘텐츠 심사 상세 정보
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {contentDetail?.status === 'reviewing' && (
                  <Chip label="심사중" color="info" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
                {contentDetail?.status === 'pending' && (
                  <Chip label="심사 대기" color="warning" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
                {contentDetail?.is_reapply && (
                  <Chip label="재심사" color="warning" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
                )}
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            {contentDetail && (
              <Box>
                {/* 썸네일 */}
                {contentDetail.thumbnail_url && (
                  <Box sx={{ mb: 4, textAlign: 'center', position: 'relative' }}>
                    <Box
                      component="img"
                      src={contentDetail.thumbnail_url}
                      alt={contentDetail.title}
                      sx={{ 
                        maxWidth: '100%', 
                        maxHeight: 400, 
                        borderRadius: 3, 
                        objectFit: 'contain',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                )}

                {/* 기본 정보 */}
                <Box sx={{ mb: 3, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    {contentDetail.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={contentDetail.category} 
                      color="primary" 
                      sx={{ fontWeight: 'bold', fontSize: '0.875rem', height: 28 }}
                    />
                    <Chip 
                      label={contentDetail.grade || '베이직'} 
                      sx={{ 
                        bgcolor: '#FF9800', 
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        height: 28
                      }} 
                    />
                    <Chip 
                      label={contentDetail.age_rating || 'All'} 
                      variant="outlined" 
                      sx={{ fontWeight: 'bold', fontSize: '0.875rem', height: 28 }}
                    />
                  </Box>
                </Box>

                {/* 설명 */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                    📝 설명
                  </Typography>
                  <Box 
                    dangerouslySetInnerHTML={{ __html: contentDetail.description || '' }}
                    sx={{ 
                      p: 3, 
                      bgcolor: 'grey.50', 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      minHeight: 100,
                      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                      '& p': { marginBottom: 1 }
                    }}
                  />
                </Box>

                {/* 상세 설명 */}
                {contentDetail.detailed_description && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}>
                      📄 상세 설명
                    </Typography>
                    <Box 
                      dangerouslySetInnerHTML={{ __html: contentDetail.detailed_description }}
                      sx={{ 
                        p: 3, 
                        bgcolor: 'grey.50', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        minHeight: 100,
                        '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
                        '& p': { marginBottom: 1 }
                      }}
                    />
                  </Box>
                )}

                {/* 상품 정보 */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ height: '100%', bgcolor: 'primary.light', bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                          💰 기본 정보
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">가격</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {contentDetail.price?.toLocaleString() || 0}원
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">판매자</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {contentDetail.seller_username || '-'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">이용가능 일수</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {contentDetail.education_period || '-'}일
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">등록일</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {contentDetail.created_at ? new Date(contentDetail.created_at).toLocaleString('ko-KR') : '-'}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ height: '100%', bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                          📅 판매 기간
                        </Typography>
                        {contentDetail.is_always_on_sale ? (
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            기간 지정 없음 (항상 판매)
                          </Typography>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">시작일</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {contentDetail.sale_start_date 
                                  ? new Date(contentDetail.sale_start_date).toLocaleDateString('ko-KR') 
                                  : '-'}
                              </Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">종료일</Typography>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {contentDetail.sale_end_date 
                                  ? new Date(contentDetail.sale_end_date).toLocaleDateString('ko-KR') 
                                  : '-'}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* 차시 정보 */}
                {contentDetail.lessons && contentDetail.lessons.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                      📚 강의 차시 ({contentDetail.lessons.length}개)
                    </Typography>
                    {contentDetail.lessons.map((lesson, index) => (
                      <Card 
                        key={lesson.id || index} 
                        variant="outlined" 
                        sx={{ 
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: 3,
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {lesson.lesson_number || index + 1}차시. {lesson.title}
                              </Typography>
                              {lesson.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {lesson.description}
                                </Typography>
                              )}
                            </Box>
                            {lesson.duration && (
                              <Chip 
                                label={`${lesson.duration}분`} 
                                size="small" 
                                color="primary"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                          </Box>
                          {lesson.cdn_link && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                                콘텐츠 링크
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                  fullWidth
                                  size="small"
                                  value={lesson.cdn_link}
                                  InputProps={{ readOnly: true }}
                                  sx={{ 
                                    bgcolor: 'white',
                                    '& .MuiInputBase-input': { 
                                      fontSize: '0.75rem',
                                      fontFamily: 'monospace'
                                    }
                                  }}
                                />
                                <Button
                                  size="medium"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => {
                                    window.open(lesson.cdn_link, '_blank');
                                  }}
                                  sx={{ minWidth: 100 }}
                                >
                                  미리보기
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* 거부 사유 (재심사인 경우) */}
                {contentDetail.rejection_reason && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 3, 
                    bgcolor: 'error.light', 
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'error.main'
                  }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.dark', mb: 2 }}>
                      ⚠️ 이전 거부 사유
                    </Typography>
                    <Typography variant="body1" color="error.dark" sx={{ whiteSpace: 'pre-wrap' }}>
                      {contentDetail.rejection_reason}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button 
              onClick={() => {
                setContentDetailDialogOpen(false);
                if (tabValue === 0) {
                  fetchData();
                }
              }}
              variant="outlined"
              size="large"
            >
              닫기
            </Button>
          </DialogActions>
        </Dialog>

        {/* 제휴할인 거부 다이얼로그 */}
        <Dialog open={partnershipRejectDialogOpen} onClose={() => setPartnershipRejectDialogOpen(false)}>
          <DialogTitle>제휴할인 신청 거부</DialogTitle>
          <DialogContent>
            {selectedPartnershipRequest && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  신청자: {selectedPartnershipRequest.name || selectedPartnershipRequest.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  고객사: {selectedPartnershipRequest.company_name}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="거부 사유"
              multiline
              rows={4}
              margin="normal"
              value={partnershipRejectReason}
              onChange={(e) => setPartnershipRejectReason(e.target.value)}
              placeholder="거부 사유를 입력해주세요..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPartnershipRejectDialogOpen(false)}>취소</Button>
            <Button
              onClick={async () => {
                if (!partnershipRejectReason) {
                  alert('거부 사유를 입력해주세요.');
                  return;
                }
                try {
                  await api.post(`/admin/partnership/${selectedPartnershipRequest.id}/reject`, {
                    reason: partnershipRejectReason
                  });
                  alert('제휴할인 신청이 거부되었습니다.');
                  setPartnershipRejectDialogOpen(false);
                  fetchData();
                } catch (error) {
                  alert('거부 처리에 실패했습니다.');
                }
              }}
              variant="contained"
              color="error"
            >
              거부
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default AdminDashboard;
