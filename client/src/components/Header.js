import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';

const Header = () => {
  const navigate = useNavigate();
  const token = getToken();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          SellEdu
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {token ? (
            <>
              <Button color="inherit" component={Link} to="/seller">
                판매자
              </Button>
              <Button color="inherit" component={Link} to="/admin">
                관리자
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                로그인
              </Button>
              <Button color="inherit" component={Link} to="/register">
                회원가입
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;


