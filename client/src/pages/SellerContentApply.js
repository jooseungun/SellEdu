import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box,
  AppBar,
  Toolbar,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../utils/api';

const SellerContentApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    cdn_link: '',
    price: '',
    duration: '',
    tags: '',
    sale_start_date: '',
    sale_end_date: '',
    is_always_on_sale: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contents/apply', {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration) || 0,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      });
      alert('콘텐츠 심사 신청이 완료되었습니다.');
      navigate('/seller');
    } catch (error) {
      alert(error.response?.data?.error || '심사 신청에 실패했습니다.');
    }
  };

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Toolbar>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/seller')}
            sx={{ color: 'white', mr: 2 }}
          >
            뒤로가기
          </Button>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            콘텐츠 심사 신청
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            콘텐츠 정보 입력
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="설명"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="썸네일 URL"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="CDN 링크"
                  required
                  value={formData.cdn_link}
                  onChange={(e) => setFormData({ ...formData, cdn_link: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="가격"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="기간 (분)"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="태그 (쉼표로 구분)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="예: 프로그래밍, 웹개발, JavaScript"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="판매 시작일"
                  type="datetime-local"
                  value={formData.sale_start_date}
                  onChange={(e) => setFormData({ ...formData, sale_start_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="판매 종료일"
                  type="datetime-local"
                  value={formData.sale_end_date}
                  onChange={(e) => setFormData({ ...formData, sale_end_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" size="large" fullWidth>
                심사 신청
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default SellerContentApply;

