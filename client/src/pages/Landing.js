import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Button, 
  Typography, 
  Card, 
  CardContent,
  Fade,
  useTheme
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Landing = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in={true} timeout={1000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                mb: 2,
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                fontSize: { xs: '2.5rem', md: '3.5rem' }
              }}
            >
              🎓 SellEdu
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(255,255,255,0.9)',
                mb: 4,
                fontWeight: 300
              }}
            >
              콘텐츠 마켓 플랫폼
            </Typography>
          </Box>
        </Fade>

        <Fade in={true} timeout={1500}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 4,
              mb: 4
            }}
          >
            {/* 구매자 버튼 */}
            <Card
              sx={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                }
              }}
              onClick={() => navigate('/buyer')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                  구매자
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                  다양한 콘텐츠를 탐색하고<br />
                  원하는 강의를 구매하세요
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #653a91 100%)',
                    }
                  }}
                >
                  구매하기
                </Button>
              </CardContent>
            </Card>

            {/* 판매자 버튼 */}
            <Card
              sx={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                }
              }}
              onClick={() => navigate('/seller')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3,
                    boxShadow: '0 4px 20px rgba(245, 87, 108, 0.4)'
                  }}
                >
                  <StoreIcon sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}>
                  판매자
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
                  나만의 콘텐츠를 업로드하고<br />
                  수익을 창출하세요
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d883e9 0%, #d4475c 100%)',
                    }
                  }}
                >
                  판매하기
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* 관리자 버튼 */}
        <Fade in={true} timeout={2000}>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => navigate('/admin')}
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'white',
                  background: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              관리자
            </Button>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Landing;

