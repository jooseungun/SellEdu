const express = require('express');
const router = express.Router();

// 인증 관련
const authRoutes = require('./auth');
const contentRoutes = require('./content');
const purchaseRoutes = require('./purchase');
const sellerRoutes = require('./seller');
const adminRoutes = require('./admin');

// API 버전
const API_VERSION = process.env.API_VERSION || 'v1';

// 라우트 등록
router.use(`/api/${API_VERSION}/auth`, authRoutes);
router.use(`/api/${API_VERSION}/contents`, contentRoutes);
router.use(`/api/${API_VERSION}/purchase`, purchaseRoutes);
router.use(`/api/${API_VERSION}/seller`, sellerRoutes);
router.use(`/api/${API_VERSION}/admin`, adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;


