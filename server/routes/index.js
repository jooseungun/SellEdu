const express = require('express');
const router = express.Router();

// Health Check 엔드포인트
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 인증 관련
const authRoutes = require('./auth');
const contentRoutes = require('./content');
const purchaseRoutes = require('./purchase');
const sellerRoutes = require('./seller');
const adminRoutes = require('./admin');
const reviewRoutes = require('./review');

// API 버전
const API_VERSION = process.env.API_VERSION || 'v1';

// 라우트 등록
router.use(`/api/${API_VERSION}/auth`, authRoutes);
router.use(`/api/${API_VERSION}/contents`, contentRoutes);
router.use(`/api/${API_VERSION}/purchase`, purchaseRoutes);
router.use(`/api/${API_VERSION}/seller`, sellerRoutes);
router.use(`/api/${API_VERSION}/admin`, adminRoutes);
router.use(`/api/${API_VERSION}/reviews`, reviewRoutes);

module.exports = router;


