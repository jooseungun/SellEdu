import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  Fade,
  useTheme,
  Stack,
  Grid
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import { getToken, removeToken, getUserName } from '../utils/auth';

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token);
    if (token) {
      setUserName(getUserName());
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <>
      {/* 헤더 */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          py: 2
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
              🎓 SellEdu
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              {isLoggedIn && userName && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {userName}님 환영합니다
                </Typography>
              )}
              {isLoggedIn ? (
                <Button
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  variant="outlined"
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      background: 'rgba(99, 102, 241, 0.05)'
                    }
                  }}
                >
                  로그아웃
                </Button>
              ) : (
                <Button
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/login')}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    }
                  }}
                >
                  로그인
                </Button>
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* 메인 히어로 섹션 */}
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          pt: 10,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={true} timeout={800}>
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  mb: 3,
                  textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                  lineHeight: 1.1
                }}
              >
                교육 콘텐츠 마켓플레이스
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: 'rgba(255,255,255,0.95)',
                  mb: 6,
                  fontWeight: 300,
                  maxWidth: '600px',
                  mx: 'auto',
                  fontSize: { xs: '1.1rem', md: '1.5rem' }
                }}
              >
                최고의 교육 콘텐츠를 만나보세요
                <br />
                학습자와 강사가 함께 성장하는 플랫폼
              </Typography>
            </Box>
          </Fade>

          <Fade in={true} timeout={1200}>
            <Grid container spacing={4} sx={{ mb: 6 }}>
              {/* 구매자 카드 */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 4,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    }
                  }}
                  onClick={() => navigate('/buyer')}
                >
                  <CardContent sx={{ p: 5, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)'
                        }
                      }}
                    >
                      <ShoppingCartIcon sx={{ fontSize: 50, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                      구매자
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8, fontSize: '1.1rem' }}>
                      다양한 교육 콘텐츠를 탐색하고
                      <br />
                      원하는 강의를 구매하세요
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        py: 1.8,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)'
                        }
                      }}
                    >
                      콘텐츠 둘러보기
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* 판매자 카드 */}
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: 4,
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    height: '100%',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    }
                  }}
                  onClick={() => navigate('/seller')}
                >
                  <CardContent sx={{ p: 5, textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 4,
                        boxShadow: '0 10px 30px rgba(236, 72, 153, 0.4)',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(-5deg)'
                        }
                      }}
                    >
                      <StoreIcon sx={{ fontSize: 50, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 700, color: 'text.primary' }}>
                      판매자
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, lineHeight: 1.8, fontSize: '1.1rem' }}>
                      나만의 교육 콘텐츠를 업로드하고
                      <br />
                      수익을 창출하세요
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
                        py: 1.8,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        textTransform: 'none',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)'
                        }
                      }}
                    >
                      콘텐츠 판매하기
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Fade>

          {/* 관리자 버튼 */}
          <Fade in={true} timeout={1600}>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => navigate('/admin')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255,255,255,0.2)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                관리자 대시보드
              </Button>
            </Box>
          </Fade>

          {/* 특징 섹션 */}
          <Fade in={true} timeout={2000}>
            <Grid container spacing={4} sx={{ mt: 8, mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <SchoolIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    다양한 콘텐츠
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    수천 개의 고품질 교육 콘텐츠
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    성장하는 플랫폼
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    학습자와 강사가 함께 성장
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center', color: 'white' }}>
                  <StoreIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    쉬운 판매
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    간편한 콘텐츠 등록과 관리
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Fade>
        </Container>
      </Box>
    </>
  );
};

export default Landing;
