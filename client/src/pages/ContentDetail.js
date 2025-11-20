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
import api from '../utils/api';
import { getToken, getUserName } from '../utils/auth';
import TossPayment from '../components/TossPayment';

// 가비지 데이터 생성 함수 (BuyerHome과 동일)
const generateMockContent = (id) => {
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

  const detailedDescriptions = [
    '프로젝트 관리 실무 과정에서는 PMBOK 기반의 프로젝트 관리 방법론을 학습하고, 실제 프로젝트 사례를 통해 실무에 바로 적용할 수 있는 스킬을 습득합니다. 프로젝트 기획, 일정 관리, 리스크 관리, 팀 관리 등 프로젝트 관리의 전 과정을 다룹니다.',
    '데이터 분석 기초 과정에서는 Excel부터 Python, R까지 다양한 도구를 활용한 데이터 분석 기법을 학습합니다. 데이터 수집, 정제, 분석, 시각화까지 전 과정을 실습을 통해 익힙니다.',
    'Python 프로그래밍 과정에서는 프로그래밍 기초부터 웹 개발, 데이터 분석까지 Python의 다양한 활용 방법을 학습합니다. 실전 프로젝트를 통해 실무 역량을 기릅니다.',
    '영어 회화 초급 과정에서는 일상 회화부터 비즈니스 영어까지 단계별로 학습합니다. 실전 대화 연습을 통해 자연스러운 영어 회화 능력을 기릅니다.',
    '토익 700점 달성 과정에서는 체계적인 학습 커리큘럼과 실전 문제 풀이를 통해 토익 700점을 목표로 합니다. 각 영역별 전략과 팁을 제공합니다.',
    '경영 전략 수립 과정에서는 경영 전략의 이론과 실무를 함께 학습합니다. SWOT 분석, 포트폴리오 분석 등 다양한 전략 도구를 활용합니다.',
    '마케팅 기초 과정에서는 마케팅의 기본 개념부터 디지털 마케팅까지 다룹니다. 타겟 고객 분석, 마케팅 전략 수립, 캠페인 기획 등을 학습합니다.',
    '인사 관리 실무 과정에서는 채용, 평가, 보상, 개발 등 인사 관리의 전 과정을 실무 관점에서 학습합니다.',
    '회계 원리 과정에서는 회계의 기본 원리를 이해하고, 재무제표 작성과 분석 방법을 학습합니다.',
    '세무 실무 과정에서는 세무의 핵심을 학습하고, 실무에서 자주 발생하는 세무 문제를 해결하는 방법을 배웁니다.',
    '정보보안 기초 과정에서는 정보보안의 기본 개념과 실무를 학습합니다. 보안 위협 분석, 대응 방안 수립 등을 다룹니다.',
    '클라우드 컴퓨팅 과정에서는 클라우드의 개념과 활용 방법을 배웁니다. AWS, Azure 등 주요 클라우드 플랫폼을 실습합니다.',
    '웹 개발 입문 과정에서는 HTML, CSS, JavaScript 기초부터 React, Node.js까지 웹 개발의 전 과정을 학습합니다.',
    '데이터베이스 설계 과정에서는 데이터베이스 설계의 원리와 실무를 학습합니다. ERD 작성, 정규화, 쿼리 최적화 등을 다룹니다.',
    '네트워크 기초 과정에서는 네트워크의 기본 개념을 이해합니다. TCP/IP, 라우팅, 보안 등을 학습합니다.',
    '인문학 특강에서는 인문학적 사고를 기르는 특강입니다. 문학, 철학, 역사를 통해 인간과 사회를 이해합니다.',
    '문학 감상법 과정에서는 문학 작품을 깊이 있게 감상하는 방법을 배웁니다. 작품 분석과 비평 방법을 학습합니다.',
    '역사 이해 과정에서는 역사를 통해 현재를 이해합니다. 한국사, 세계사를 통해 역사적 사고력을 기릅니다.',
    '철학 입문 과정에서는 철학의 기본 개념을 이해합니다. 서양 철학과 동양 철학을 통해 철학적 사고를 배웁니다.',
    '예술 감상 과정에서는 예술 작품을 감상하는 방법을 배웁니다. 미술, 음악, 문학 등 다양한 예술 장르를 다룹니다.',
    '자격증 준비반에서는 각종 자격증 취득을 위한 체계적인 준비 과정을 제공합니다.',
    '공인중개사 과정에서는 공인중개사 자격증 취득을 위한 강의입니다. 부동산 관련 법규와 실무를 학습합니다.',
    '회계사 과정에서는 회계사 자격증 취득을 위한 강의입니다. 회계 원리와 실무를 학습합니다.',
    '변호사 과정에서는 변호사 자격증 취득을 위한 강의입니다. 법률 기초와 실무를 학습합니다.',
    '의사 과정에서는 의사 국가고시 준비를 위한 강의입니다. 의학 기초와 임상 실무를 학습합니다.',
    '산업기술 특강에서는 산업기술의 최신 동향을 학습합니다. 4차 산업혁명 기술을 이해합니다.',
    '4차 산업혁명 과정에서는 4차 산업혁명의 핵심 기술을 이해합니다. AI, IoT, 빅데이터 등을 다룹니다.',
    'AI 기초 과정에서는 인공지능의 기초 개념을 학습합니다. 머신러닝, 딥러닝의 기본을 이해합니다.',
    '빅데이터 분석 과정에서는 빅데이터 분석 방법을 배웁니다. 데이터 수집, 분석, 시각화를 학습합니다.',
    '블록체인 이해 과정에서는 블록체인 기술의 원리와 활용을 이해합니다. 암호화폐, 스마트 컨트랙트 등을 다룹니다.'
  ];

  const instructors = [
    '김교수', '이강사', '박선생', '최교수', '정강사',
    '한교수', '윤강사', '임선생', '조교수', '강강사',
    '신교수', '오강사', '유선생', '노교수', '문강사',
    '양교수', '백강사', '송선생', '홍교수', '고강사',
    '남교수', '서강사', '전선생', '주교수', '류강사',
    '강교수', '배강사', '허선생', '남교수', '심강사'
  ];

  const index = (parseInt(id) - 1) % titles.length;
  const contentId = parseInt(id) || 1;

  // 콘텐츠 목차 생성
  const lessons = [];
  const lessonCount = Math.floor(Math.random() * 5) + 4; // 4-8개
  for (let i = 0; i < lessonCount; i++) {
    lessons.push({
      id: i + 1,
      title: `${i + 1}번. ${titles[index]} - ${i + 1}부`,
      duration: [30, 45, 60, 90, 120][Math.floor(Math.random() * 5)],
      display_order: i + 1,
      cdn_link: `https://example.com/video/${contentId}-${i + 1}`
    });
  }

  return {
    id: contentId,
    title: titles[index],
    description: descriptions[index],
    detailed_description: detailedDescriptions[index],
    thumbnail_url: null, // 기본 썸네일 사용
    price: [9900, 14900, 19900, 24900, 29900, 0][index % 6],
    category: categories[index % categories.length],
    grade: grades[index % grades.length],
    age: ages[index % ages.length],
    purchase_count: Math.floor(Math.random() * 100) + 10,
    avg_rating: (Math.random() * 2 + 3).toFixed(1),
    review_count: Math.floor(Math.random() * 50) + 5,
    duration: [60, 90, 120, 150, 180][index % 5],
    education_period: 999,
    instructor: instructors[index],
    lessons: lessons,
    tags: [categories[index % categories.length], '온라인', '실무'],
    created_at: new Date().toISOString()
  };
};

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [tabValue, setTabValue] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    fetchContent();
    fetchReviews();
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/contents/${id}`);
      console.log('ContentDetail - API response:', response.data);
      
      if (response.data && response.data.id) {
        // API 응답 데이터를 그대로 사용하되, 필요한 필드가 없으면 기본값 설정
        const contentData = {
          ...response.data,
          detailed_description: response.data.detailed_description || response.data.description || '',
          lessons: response.data.lessons || [],
          tags: response.data.tags || (response.data.category ? [response.data.category, '온라인', '실무'] : ['온라인', '실무']),
          instructor: response.data.instructor || response.data.seller_name || response.data.seller_username || '기업명',
          education_period: response.data.education_period || 999,
          thumbnail_url: response.data.thumbnail_url || null
        };
        setContent(contentData);
      } else {
        throw new Error('Invalid response data');
      }
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error);
      console.error('Error details:', error.response?.data);
      // API 실패 시 가비지 데이터 표시 (프로토타입용)
      const mockContent = generateMockContent(id);
      setContent(mockContent);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews`, { params: { content_id: id } });
      setReviews(response.data || []);
    } catch (error) {
      console.error('리뷰 조회 실패:', error);
      // 프로토타입: 가비지 리뷰 데이터 생성
      const mockReviews = generateMockReviews(parseInt(id) || 1);
      setReviews(mockReviews);
    }
  };

  const generateMockReviews = (contentId) => {
    const names = ['A기업', 'B기업', 'C기업', 'D기업', 'E기업', 'F기업', 'G기업'];
    const comments = [
      '정말 유익한 콘텐츠였습니다. 실무에 바로 적용할 수 있어서 좋았어요!',
      '콘텐츠 구성이 체계적이고 이해하기 쉬웠습니다.',
      '내용이 체계적이고 실습 예제가 많아서 좋았습니다.',
      '가격 대비 만족도가 높은 콘텐츠입니다.',
      '초보자도 따라하기 쉽게 구성되어 있어서 추천합니다.',
      '실무 경험이 풍부한 기업의 콘텐츠라서 실용적이었습니다.',
      '콘텐츠 자료가 잘 정리되어 있어서 활용하기 좋았습니다.'
    ];
    
    const reviewCount = Math.floor(Math.random() * 5) + 3; // 3-7개
    return Array.from({ length: reviewCount }, (_, i) => ({
      id: i + 1,
      buyer_username: names[i % names.length],
      rating: Math.floor(Math.random() * 2) + 4, // 4-5점
      comment: comments[i % comments.length],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));
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

    setPaymentLoading(true);
    try {
      // 결제 요청 API 호출
      const response = await api.post('/payments/request', {
        content_id: content.id,
        amount: content.price
      });

      setPaymentInfo(response.data);
      setPaymentDialogOpen(true);
    } catch (error) {
      console.error('결제 요청 실패:', error);
      alert(error.response?.data?.error || '결제 요청에 실패했습니다.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentKey) => {
    try {
      // 결제 승인 API 호출
      const response = await api.post('/payments/approve', {
        orderId: paymentInfo.orderId,
        paymentKey: paymentKey,
        amount: paymentInfo.amount
      });

      alert('결제가 완료되었습니다!');
      setPaymentDialogOpen(false);
      setPaymentInfo(null);
      
      // 콘텐츠 정보 새로고침
      fetchContent();
    } catch (error) {
      console.error('결제 승인 실패:', error);
      alert(error.response?.data?.error || '결제 승인에 실패했습니다.');
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


  const handleReviewSubmit = async () => {
    alert('이 기능은 현재 개발 중입니다.\n프로토타입 버전에서는 리뷰 작성이 되지 않습니다.');
    setReviewDialogOpen(false);
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
                image="/default-thumbnail.svg"
                alt={content.title}
                sx={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/default-thumbnail.svg';
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
                    <Rating value={parseFloat(content.avg_rating)} readOnly precision={0.1} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {content.avg_rating}점
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({content.review_count}개 리뷰)
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
                              {review.buyer_username}
                            </Typography>
                            <Rating value={review.rating} readOnly size="small" />
                          </Box>
                          <Typography variant="body2" paragraph>
                            {review.comment}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(review.created_at).toLocaleDateString('ko-KR')}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))
                  )}
                  <Button
                    variant="outlined"
                    onClick={() => setReviewDialogOpen(true)}
                    sx={{ mt: 2 }}
                  >
                    리뷰 작성
                  </Button>
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
                {content.price > 0 ? (
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                    {content.price.toLocaleString()}원
                  </Typography>
                ) : (
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
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {content.price > 0 ? `${content.price.toLocaleString()}원` : '무료'}
                </Typography>
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

      {/* 리뷰 작성 다이얼로그 */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>리뷰 작성</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography component="legend">평점</Typography>
            <Rating
              value={reviewForm.rating}
              onChange={(e, newValue) => setReviewForm({ ...reviewForm, rating: newValue })}
            />
          </Box>
          <TextField
            fullWidth
            label="리뷰 내용"
            multiline
            rows={4}
            margin="normal"
            value={reviewForm.comment}
            onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>취소</Button>
          <Button onClick={handleReviewSubmit} variant="contained">작성</Button>
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
                orderId={paymentInfo.orderId}
                orderNumber={paymentInfo.orderNumber}
                amount={paymentInfo.amount}
                orderName={paymentInfo.orderName}
                customerName={paymentInfo.customerName}
                customerEmail={paymentInfo.customerEmail}
                successUrl={paymentInfo.successUrl}
                failUrl={paymentInfo.failUrl}
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
    </>
  );
};

export default ContentDetail;
