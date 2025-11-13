import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { setToken } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [findIdDialogOpen, setFindIdDialogOpen] = useState(false);
  const [findPasswordDialogOpen, setFindPasswordDialogOpen] = useState(false);
  const [findIdForm, setFindIdForm] = useState({ email: '' });
  const [findPasswordForm, setFindPasswordForm] = useState({ username: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', formData);
      setToken(response.data.token);
      navigate('/');
    } catch (error) {
      alert(error.response?.data?.error || '로그인에 실패했습니다.');
    }
  };

  const handleFindId = async () => {
    try {
      // TODO: 아이디 찾기 API 구현 필요
      alert('아이디 찾기 기능은 준비 중입니다. 관리자에게 문의하세요.');
      setFindIdDialogOpen(false);
    } catch (error) {
      alert('아이디 찾기에 실패했습니다.');
    }
  };

  const handleFindPassword = async () => {
    try {
      // TODO: 비밀번호 찾기 API 구현 필요
      alert('비밀번호 찾기 기능은 준비 중입니다. 관리자에게 문의하세요.');
      setFindPasswordDialogOpen(false);
    } catch (error) {
      alert('비밀번호 찾기에 실패했습니다.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          로그인
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="아이디"
            margin="normal"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />
          <TextField
            fullWidth
            label="비밀번호"
            type="password"
            margin="normal"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
            로그인
          </Button>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setFindIdDialogOpen(true)}
              sx={{ cursor: 'pointer' }}
            >
              아이디 찾기
            </Link>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setFindPasswordDialogOpen(true)}
              sx={{ cursor: 'pointer' }}
            >
              비밀번호 찾기
            </Link>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              계정이 없으신가요?
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/register')}
            >
              회원가입
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 아이디 찾기 다이얼로그 */}
      <Dialog open={findIdDialogOpen} onClose={() => setFindIdDialogOpen(false)}>
        <DialogTitle>아이디 찾기</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="이메일"
            type="email"
            margin="normal"
            value={findIdForm.email}
            onChange={(e) => setFindIdForm({ email: e.target.value })}
            placeholder="가입 시 등록한 이메일을 입력하세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFindIdDialogOpen(false)}>취소</Button>
          <Button onClick={handleFindId} variant="contained">찾기</Button>
        </DialogActions>
      </Dialog>

      {/* 비밀번호 찾기 다이얼로그 */}
      <Dialog open={findPasswordDialogOpen} onClose={() => setFindPasswordDialogOpen(false)}>
        <DialogTitle>비밀번호 찾기</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="아이디"
            margin="normal"
            value={findPasswordForm.username}
            onChange={(e) => setFindPasswordForm({ ...findPasswordForm, username: e.target.value })}
          />
          <TextField
            fullWidth
            label="이메일"
            type="email"
            margin="normal"
            value={findPasswordForm.email}
            onChange={(e) => setFindPasswordForm({ ...findPasswordForm, email: e.target.value })}
            placeholder="가입 시 등록한 이메일을 입력하세요"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFindPasswordDialogOpen(false)}>취소</Button>
          <Button onClick={handleFindPassword} variant="contained">찾기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login;
