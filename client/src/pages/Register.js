import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, FormControlLabel, Checkbox, FormGroup } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    mobile: ''
  });
  const [roles, setRoles] = useState({
    buyer: true,
    seller: false
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // 휴대폰 번호 포맷팅 (000-0000-0000)
  const formatMobileNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 11자리 제한
    const limited = numbers.slice(0, 11);
    
    // 하이픈 추가
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 7) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
    }
  };

  const handleMobileChange = (e) => {
    const formatted = formatMobileNumber(e.target.value);
    setFormData({ ...formData, mobile: formatted });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 최소 6자 이상이어야 합니다.';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    // 선택된 권한 배열 생성
    const selectedRoles = [];
    if (roles.buyer) selectedRoles.push('buyer');
    if (roles.seller) selectedRoles.push('seller');

    if (selectedRoles.length === 0) {
      setSubmitError('최소 하나 이상의 권한을 선택해주세요.');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        mobile: formData.mobile.replace(/[^\d]/g, ''), // 하이픈 제거하여 숫자만 전송
        roles: selectedRoles
      });

      if (response.data.message) {
        alert('회원가입이 완료되었습니다. 로그인해주세요.');
        navigate('/login');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || '회원가입에 실패했습니다.';
      setSubmitError(errorMessage);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          mt: 4,
          mb: 2
        }}
      >
        <Typography
          variant="h4"
          component="div"
          onClick={() => navigate('/')}
          sx={{
            cursor: 'pointer',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            userSelect: 'none',
            '&:hover': {
              opacity: 0.8
            }
          }}
        >
          SellEdu
        </Typography>
      </Box>
      <Paper sx={{ p: 4, mt: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          회원가입
        </Typography>
        
        {submitError && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="아이디"
            margin="normal"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={!!errors.username}
            helperText={errors.username}
            required
          />
          <TextField
            fullWidth
            label="이메일"
            type="email"
            margin="normal"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            helperText={errors.email}
            required
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            margin="normal"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            helperText={errors.password || '최소 6자 이상'}
            required
          />
          <TextField
            fullWidth
            label="비밀번호 확인"
            type="password"
            margin="normal"
            value={formData.passwordConfirm}
            onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
            error={!!errors.passwordConfirm}
            helperText={errors.passwordConfirm}
            required
          />
          <TextField
            fullWidth
            label="이름"
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
          <TextField
            fullWidth
            label="휴대폰번호"
            margin="normal"
            value={formData.mobile}
            onChange={handleMobileChange}
            placeholder="010-0000-0000"
            inputProps={{ maxLength: 13 }}
            helperText="숫자만 입력하면 자동으로 하이픈이 추가됩니다."
          />
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
              권한 선택 (복수 선택 가능)
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={roles.buyer}
                    onChange={(e) => setRoles({ ...roles, buyer: e.target.checked })}
                  />
                }
                label="구매자"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={roles.seller}
                    onChange={(e) => setRoles({ ...roles, seller: e.target.checked })}
                  />
                }
                label="판매자"
              />
            </FormGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              최소 하나 이상의 권한을 선택해야 합니다.
            </Typography>
          </Box>
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            회원가입
          </Button>
          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate('/login')}
          >
            로그인으로 돌아가기
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
