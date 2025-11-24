import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, CardMedia, Typography, TextField, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { getThumbnailUrl } from '../utils/thumbnail';

const Home = () => {
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
                image={getThumbnailUrl(content.thumbnail_url)}
                alt={content.title}
                onError={(e) => {
                  e.target.src = getThumbnailUrl();
                }}
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
  );
};

export default Home;


