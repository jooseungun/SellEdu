import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, CardMedia, Typography, TextField, Box, AppBar, Toolbar, Button } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../utils/api';

const BuyerHome = () => {
  const navigate = useNavigate();
  const [contents, setContents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await api.get('/contents', {
        params: { search }
      });
      setContents(response.data.contents || []);
    } catch (error) {
      console.error('콘텐츠 목록 조회 실패:', error);
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
            구매자 페이지
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="콘텐츠 검색"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchContents();
              }
            }}
          />
        </Box>
        <Grid container spacing={3}>
          {contents.map((content) => (
            <Grid item xs={12} sm={6} md={4} key={content.id}>
              <Card component={Link} to={`/content/${content.id}`} sx={{ textDecoration: 'none', height: '100%' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={content.thumbnail_url || '/placeholder.jpg'}
                  alt={content.title}
                />
                <CardContent>
                  <Typography variant="h6" component="div" noWrap>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {content.description?.substring(0, 100)}...
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                    {content.price?.toLocaleString()}원
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
};

export default BuyerHome;

