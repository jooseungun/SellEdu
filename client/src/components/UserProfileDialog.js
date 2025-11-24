import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import api from '../utils/api';
import { getToken } from '../utils/auth';

const UserProfileDialog = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 프로필 정보
  const [profileData, setProfileData] = useState({
    email: '',
    name: '',
    birth_date: '',
    phone: '',
    mobile: ''
  });

  // 비밀번호 변경
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // 사용자 정보 조회
  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    if (!getToken()) {
      setError('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/user/profile');
      setProfileData({
        email: response.data.email || '',
        name: response.data.name || '',
        birth_date: response.data.birth_date || '',
        phone: response.data.phone || '',
        mobile: response.data.mobile || ''
      });
    } catch (error) {
      console.error('프로필 조회 실패:', error);
      setError(error.response?.data?.error || '프로필 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field) => (e) => {
    setProfileData({
      ...profileData,
      [field]: e.target.value
    });
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswordData({
      ...passwordData,
      [field]: e.target.value
    });
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put('/user/profile', profileData);
      setSuccess('정보가 변경되었습니다.');
      setTimeout(() => {
        onClose();
        setSuccess(null);
        fetchProfile();
      }, 1500);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      setError(error.response?.data?.error || '정보 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // 비밀번호 확인
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      await api.put('/user/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setSuccess('비밀번호가 변경되었습니다.');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      setError(error.response?.data?.error || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(null);
    setTabValue(0);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>정보 변경</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab icon={<PersonIcon />} iconPosition="start" label="프로필 정보" />
            <Tab icon={<LockIcon />} iconPosition="start" label="비밀번호 변경" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading && tabValue === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {tabValue === 0 && !loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="이름"
              value={profileData.name}
              onChange={handleProfileChange('name')}
              fullWidth
              required
            />
            <TextField
              label="이메일"
              type="email"
              value={profileData.email}
              onChange={handleProfileChange('email')}
              fullWidth
              required
            />
            <TextField
              label="생년월일"
              type="date"
              value={profileData.birth_date}
              onChange={handleProfileChange('birth_date')}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />
            <TextField
              label="전화번호"
              value={profileData.phone}
              onChange={handleProfileChange('phone')}
              fullWidth
              placeholder="010-1234-5678"
            />
            <TextField
              label="휴대폰 번호"
              value={profileData.mobile}
              onChange={handleProfileChange('mobile')}
              fullWidth
              placeholder="010-1234-5678"
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
              * 아이디는 변경할 수 없습니다.
            </Typography>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="현재 비밀번호"
              type="password"
              value={passwordData.current_password}
              onChange={handlePasswordChange('current_password')}
              fullWidth
              required
            />
            <TextField
              label="새 비밀번호"
              type="password"
              value={passwordData.new_password}
              onChange={handlePasswordChange('new_password')}
              fullWidth
              required
              helperText="최소 6자 이상"
            />
            <TextField
              label="새 비밀번호 확인"
              type="password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange('confirm_password')}
              fullWidth
              required
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>취소</Button>
        {tabValue === 0 ? (
          <Button
            onClick={handleProfileUpdate}
            variant="contained"
            disabled={loading}
          >
            저장
          </Button>
        ) : (
          <Button
            onClick={handlePasswordUpdate}
            variant="contained"
            disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
          >
            비밀번호 변경
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UserProfileDialog;

