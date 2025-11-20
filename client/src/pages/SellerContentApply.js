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
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Card,
  CardContent,
  Divider,
  Checkbox,
  FormGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactQuill from 'react-quill';
import api from '../utils/api';
import { getToken, getUserFromToken, isSeller, removeToken } from '../utils/auth';
import { useEffect } from 'react';

const SellerContentApply = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    detailed_description: '',
    thumbnail_url: '',
    price: '',
    category: '인문교양',
    education_period: '',
    sale_start_date: '',
    sale_end_date: '',
    is_always_on_sale: false
  });
  const [lessons, setLessons] = useState([]);

  // 판매자 권한 체크
  useEffect(() => {
    const token = getToken();
    
    if (!token) {
      console.log('SellerContentApply - No token, redirecting to login');
      navigate('/login?from=/seller/apply', { replace: true });
      return;
    }
    
    // 판매자 권한 체크
    const sellerCheck = isSeller();
    console.log('SellerContentApply - Seller check:', sellerCheck);
    if (!sellerCheck) {
      const user = getUserFromToken();
      console.log('SellerContentApply - User info:', user);
      alert(`판매자 권한이 필요합니다. 현재 권한: ${(user?.roles || (user?.role ? [user?.role] : ['buyer'])).join(', ')}`);
      navigate('/');
      return;
    }
  }, [navigate]);

  const categories = [
    '인문교양', '전문직무', '공통직무', '자격증', 'IT', 
    '외국어', '어학', '경영직무', '법정교육', '직무', 
    '산업기술지식', '경영일반'
  ];

  const [uploading, setUploading] = useState(false);

  const handleThumbnailChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 업로드
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      console.log('Thumbnail upload - Starting upload:', { 
        fileName: file.name, 
        fileSize: file.size, 
        fileType: file.type 
      });

      const response = await api.post('/upload/thumbnail', uploadFormData);

      console.log('Thumbnail upload - Response:', response.data);

      if (response.data?.thumbnail_url) {
        setFormData({ ...formData, thumbnail_url: response.data.thumbnail_url });
        alert('썸네일이 업로드되었습니다.');
      } else {
        console.error('Thumbnail upload - No thumbnail_url in response:', response.data);
        alert('썸네일 업로드에 실패했습니다. 응답에 썸네일 URL이 없습니다.');
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      const errorMessage = error.response?.data?.error || error.message || '알 수 없는 오류가 발생했습니다.';
      const errorDetails = error.response?.data?.details || '';
      console.error('Thumbnail upload - Error details:', { errorMessage, errorDetails });
      alert(`썸네일 업로드에 실패했습니다: ${errorMessage}${errorDetails ? `\n${errorDetails}` : ''}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddLesson = () => {
    setLessons([...lessons, { title: '', cdn_link: '', duration: 0 }]);
  };

  const handleRemoveLesson = (index) => {
    setLessons(lessons.filter((_, i) => i !== index));
  };

  const handleLessonChange = (index, field, value) => {
    const updatedLessons = [...lessons];
    updatedLessons[index][field] = value;
    setLessons(updatedLessons);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!formData.category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    if (lessons.length === 0) {
      alert('최소 1개 이상의 콘텐츠를 추가해주세요.');
      return;
    }

    // 콘텐츠 유효성 검사
    for (let i = 0; i < lessons.length; i++) {
      if (!lessons[i].title || !lessons[i].cdn_link) {
        alert(`${i + 1}번째 콘텐츠의 제목과 CDN 링크를 모두 입력해주세요.`);
        return;
      }
    }

    try {
      // 날짜를 ISO 형식으로 변환 (00:00:00 기준)
      const saleStartDate = formData.sale_start_date 
        ? new Date(formData.sale_start_date.split('T')[0] + 'T00:00:00').toISOString()
        : null;
      const saleEndDate = formData.is_always_on_sale 
        ? null 
        : (formData.sale_end_date 
          ? new Date(formData.sale_end_date.split('T')[0] + 'T00:00:00').toISOString()
          : null);

      await api.post('/contents/apply', {
        ...formData,
        price: parseFloat(formData.price) || 0,
        education_period: parseInt(formData.education_period) || null,
        sale_start_date: saleStartDate,
        sale_end_date: saleEndDate,
        lessons: lessons.map((lesson, index) => ({
          lesson_number: index + 1,
          title: lesson.title,
          cdn_link: lesson.cdn_link,
          duration: parseInt(lesson.duration) || 0
        }))
      });
      alert('콘텐츠 등록 신청이 완료되었습니다.');
      navigate('/seller');
    } catch (error) {
      alert(error.response?.data?.error || '등록 신청에 실패했습니다.');
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
            콘텐츠 등록 신청
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            콘텐츠 등록 정보 입력
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={3}>
              {/* 제목 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="제목"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="콘텐츠 제목을 입력하세요"
                />
              </Grid>

              {/* 설명 (에디터) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  설명
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="콘텐츠 설명을 입력하세요"
                  style={{ height: '200px', marginBottom: '50px' }}
                />
              </Grid>

              {/* 상세 설명 (에디터) */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  상세 설명
                </Typography>
                <ReactQuill
                  theme="snow"
                  value={formData.detailed_description}
                  onChange={(value) => setFormData({ ...formData, detailed_description: value })}
                  placeholder="콘텐츠 상세 설명을 입력하세요"
                  style={{ height: '200px', marginBottom: '50px' }}
                />
              </Grid>

              {/* 썸네일 업로드 */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  썸네일 (선택사항)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AddIcon />}
                    disabled={uploading}
                  >
                    {uploading ? '업로드 중...' : '썸네일 업로드'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleThumbnailChange}
                    />
                  </Button>
                  {formData.thumbnail_url && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        component="img"
                        src={formData.thumbnail_url}
                        alt="썸네일 미리보기"
                        onError={(e) => {
                          e.target.src = '/default-thumbnail.svg';
                        }}
                        sx={{ 
                          maxWidth: 200, 
                          maxHeight: 150, 
                          objectFit: 'cover', 
                          borderRadius: 1,
                          border: '1px solid #ddd'
                        }}
                      />
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setFormData({ ...formData, thumbnail_url: '' })}
                      >
                        제거
                      </Button>
                    </Box>
                  )}
                  {!formData.thumbnail_url && (
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        기본 썸네일이 사용됩니다:
                      </Typography>
                      <Box
                        component="img"
                        src="/default-thumbnail.svg"
                        alt="기본 썸네일"
                        sx={{ 
                          maxWidth: 200, 
                          maxHeight: 150, 
                          objectFit: 'cover', 
                          borderRadius: 1,
                          border: '1px solid #ddd'
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* 판매희망가격 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="판매희망가격 (원)"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              {/* 이용가능 일수 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="이용가능 일수"
                  type="number"
                  value={formData.education_period}
                  onChange={(e) => setFormData({ ...formData, education_period: e.target.value })}
                  inputProps={{ min: 1 }}
                  placeholder="예: 30 (30일간 이용 가능)"
                />
              </Grid>

              {/* 카테고리 (라디오박스) */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">카테고리</FormLabel>
                  <RadioGroup
                    row
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    sx={{ mt: 1 }}
                  >
                    {categories.map((cat) => (
                      <FormControlLabel
                        key={cat}
                        value={cat}
                        control={<Radio />}
                        label={cat}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* 판매 기간 */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    판매 기간 설정
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="판매 시작일"
                        type="date"
                        value={formData.sale_start_date ? formData.sale_start_date.split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          // 날짜만 입력하면 00:00:00으로 설정
                          setFormData({ ...formData, sale_start_date: date ? `${date}T00:00:00` : '' });
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        label="판매 종료일"
                        type="date"
                        value={formData.sale_end_date ? formData.sale_end_date.split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          // 날짜만 입력하면 00:00:00으로 설정
                          setFormData({ ...formData, sale_end_date: date ? `${date}T00:00:00` : '' });
                        }}
                        InputLabelProps={{ shrink: true }}
                        disabled={formData.is_always_on_sale}
                        sx={{
                          '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: '#9e9e9e',
                            bgcolor: '#f5f5f5'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.is_always_on_sale}
                            onChange={(e) => setFormData({ ...formData, is_always_on_sale: e.target.checked })}
                          />
                        }
                        label="기간지정없음"
                        sx={{ 
                          mt: 1,
                          '& .MuiFormControlLabel-label': {
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* 콘텐츠 구성 */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    콘텐츠 구성
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddLesson}
                  >
                    콘텐츠 추가
                  </Button>
                </Box>

                {lessons.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed #ccc', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      콘텐츠를 추가해주세요
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {lessons.map((lesson, index) => (
                      <Card key={index} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1">
                              {index + 1}번
                            </Typography>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveLesson(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="콘텐츠명"
                                required
                                value={lesson.title}
                                onChange={(e) => handleLessonChange(index, 'title', e.target.value)}
                                placeholder="예: 1번. 콘텐츠 소개"
                              />
                            </Grid>
                            <Grid item xs={12} sm={8}>
                              <TextField
                                fullWidth
                                label="콘텐츠 CDN 링크"
                                required
                                value={lesson.cdn_link}
                                onChange={(e) => handleLessonChange(index, 'cdn_link', e.target.value)}
                                placeholder="https://..."
                              />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <TextField
                                fullWidth
                                label="재생 시간 (분)"
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => handleLessonChange(index, 'duration', e.target.value)}
                                inputProps={{ min: 0 }}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/seller')}
                sx={{ flex: 1 }}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ flex: 1 }}
              >
                등록 신청
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default SellerContentApply;
