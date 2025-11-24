import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Badge, IconButton } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SettingsIcon from '@mui/icons-material/Settings';
import { getToken, removeToken } from '../utils/auth';
import api from '../utils/api';
import UserProfileDialog from './UserProfileDialog';

const Header = () => {
  const navigate = useNavigate();
  const token = getToken();
  const [cartCount, setCartCount] = useState(0);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCartCount();
      // 주기적으로 장바구니 개수 업데이트 (30초마다)
      const interval = setInterval(fetchCartCount, 30000);
      return () => clearInterval(interval);
    } else {
      setCartCount(0);
    }
  }, [token]);

  const fetchCartCount = async () => {
    try {
      const response = await api.get('/cart/count');
      setCartCount(response.data.count || 0);
    } catch (error) {
      // 에러가 발생해도 무시 (로그인하지 않은 경우 등)
      setCartCount(0);
    }
  };

  const handleLogout = () => {
    removeToken();
    setCartCount(0);
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          SellEdu
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {token ? (
            <>
              <Button color="inherit" component={Link} to="/buyer">
                콘텐츠 구매
              </Button>
              <IconButton
                color="inherit"
                component={Link}
                to="/cart"
                sx={{ position: 'relative' }}
              >
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <Button color="inherit" component={Link} to="/seller">
                판매자
              </Button>
              <Button color="inherit" component={Link} to="/admin">
                관리자
              </Button>
              <IconButton
                color="inherit"
                onClick={() => setProfileDialogOpen(true)}
                title="정보 변경"
              >
                <SettingsIcon />
              </IconButton>
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
      <UserProfileDialog
        open={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
    </AppBar>
  );
};

export default Header;


