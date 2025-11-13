import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Landing from './pages/Landing';
import BuyerHome from './pages/BuyerHome';
import Subscription from './pages/Subscription';
import ApiGuide from './pages/ApiGuide';
import ContentDetail from './pages/ContentDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import SellerDashboard from './pages/SellerDashboard';
import SellerApiGuide from './pages/SellerApiGuide';
import AdminDashboard from './pages/AdminDashboard';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#f5576c',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/buyer" element={<BuyerHome />} />
          <Route path="/buyer/subscription" element={<Subscription />} />
          <Route path="/buyer/api-guide" element={<ApiGuide />} />
          <Route path="/content/:id" element={<ContentDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/seller/apply" element={<SellerContentApply />} />
          <Route path="/seller/api-guide" element={<SellerApiGuide />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;


