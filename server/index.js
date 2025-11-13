const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { logApiCall } = require('./middleware/auth');
const initAdmin = require('./database/initAdmin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 서버 시작 시 관리자 계정 초기화
// 데이터베이스 연결 후 실행되도록 약간의 지연 추가
setTimeout(() => {
  initAdmin().catch(err => {
    console.error('관리자 계정 초기화 실패:', err);
    // 에러가 발생해도 서버는 계속 실행
  });
}, 2000);

// 미들웨어
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// OPTIONS 요청 처리 (CORS preflight)
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logApiCall);

// 라우트
app.use(routes);

// 에러 핸들링
app.use((err, req, res, next) => {
  console.error('에러 발생:', err);
  res.status(err.status || 500).json({
    error: err.message || '서버 오류가 발생했습니다.'
  });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 SellEdu 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📝 API 버전: ${process.env.API_VERSION || 'v1'}`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;


