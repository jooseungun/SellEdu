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
  CardContent
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CodeIcon from '@mui/icons-material/Code';
import api from '../utils/api';
import { getToken } from '../utils/auth';

const ContentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchContent();
    fetchReviews();
  }, [id]);

  const fetchContent = async () => {
    try {
      const response = await api.get(`/contents/${id}`);
      setContent(response.data);
    } catch (error) {
      console.error('콘텐츠 조회 실패:', error);
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
    }
  };

  const handlePurchase = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/purchase', { content_id: parseInt(id) });
      alert('구매가 완료되었습니다!');
      fetchContent();
    } catch (error) {
      alert(error.response?.data?.error || '구매에 실패했습니다.');
    }
  };

  const handleReviewSubmit = async () => {
    if (!getToken()) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/reviews', {
        content_id: parseInt(id),
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      alert('리뷰가 작성되었습니다.');
      setReviewDialogOpen(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error || '리뷰 작성에 실패했습니다.');
    }
  };

  if (loading) return <Container>로딩 중...</Container>;
  if (!content) return <Container>콘텐츠를 찾을 수 없습니다.</Container>;

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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            콘텐츠 상세
          </Typography>
          <Button
            startIcon={<CodeIcon />}
            onClick={() => navigate('/buyer/api-guide')}
            sx={{ color: 'white' }}
          >
            API 가이드
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {content.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {content.description}
          </Typography>
          <Box sx={{ my: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h5" color="primary">
              {content.price?.toLocaleString()}원
            </Typography>
            {content.avg_rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={content.avg_rating} readOnly precision={0.1} />
                <Typography variant="body2">
                  ({content.avg_rating.toFixed(1)}) {content.review_count || 0}개 리뷰
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ my: 2 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handlePurchase}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mr: 2
              }}
            >
              구매하기
            </Button>
            <Button
              variant="outlined"
              onClick={() => setReviewDialogOpen(true)}
            >
              리뷰 작성
            </Button>
          </Box>
        </Paper>

        {/* 1차시 맛보기 */}
        {content.lessons && content.lessons.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              1차시 맛보기 (10분)
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {content.lessons[0].title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CDN 링크: {content.lessons[0].cdn_link}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* 리뷰 섹션 */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            리뷰 ({reviews.length})
          </Typography>
          <Divider sx={{ my: 2 }} />
          {reviews.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              아직 리뷰가 없습니다.
            </Typography>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">{review.buyer_username}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2">{review.comment}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Paper>
      </Container>

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
    </>
  );
};

export default ContentDetail;
