# Cloudflare Workers로 마이그레이션 가이드

## ⚠️ 주의사항

현재 Express.js 서버를 Cloudflare Workers로 마이그레이션하려면 **상당한 코드 수정**이 필요합니다.

## 🔄 주요 변경사항

### 1. 서버 구조 변경

**현재 (Express.js):**
```javascript
const express = require('express');
const app = express();
app.listen(3000);
```

**Workers 형식:**
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World');
  }
}
```

### 2. 라우팅 변경

**현재:**
```javascript
app.get('/api/v1/auth/login', handler);
```

**Workers:**
```javascript
if (request.url.endsWith('/api/v1/auth/login') && request.method === 'POST') {
  return handleLogin(request);
}
```

### 3. 데이터베이스 변경

**현재:** MySQL 직접 연결
```javascript
const mysql = require('mysql2/promise');
const pool = mysql.createPool({...});
```

**Workers 옵션:**
1. **D1 Database (SQLite)** - Cloudflare 네이티브
2. **외부 MySQL** - HTTP 연결 또는 TCP over Workers
3. **PlanetScale** - MySQL 호환 서버리스

### 4. 미들웨어 변경

**현재:**
```javascript
app.use(cors());
app.use(express.json());
```

**Workers:**
```javascript
// CORS는 수동으로 처리
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// JSON 파싱
const body = await request.json();
```

## 📝 마이그레이션 단계

### 1단계: Workers 프로젝트 생성
```bash
npm create cloudflare@latest selledu-workers
cd selledu-workers
```

### 2단계: 코드 변환
- Express 라우터를 Workers 라우터로 변환
- 미들웨어를 함수로 변환
- 데이터베이스 연결을 D1 또는 외부 DB로 변경

### 3단계: D1 Database 설정
```bash
wrangler d1 create selledu-db
```

### 4단계: 배포
```bash
wrangler publish
```

## 💡 대안: Hono 프레임워크 사용

Workers에서 Express.js와 유사한 경험을 원한다면 **Hono** 프레임워크를 사용할 수 있습니다.

```javascript
import { Hono } from 'hono';

const app = new Hono();

app.post('/api/v1/auth/login', async (c) => {
  const body = await c.req.json();
  // 로직 처리
  return c.json({ token: '...' });
});

export default app;
```

## ⏱️ 예상 작업 시간

- **기본 마이그레이션**: 2-3일
- **테스트 및 디버깅**: 1-2일
- **총 예상 시간**: 3-5일

## 🎯 결론

**현재 상황에서는 Railway 사용을 권장합니다:**
- 코드 수정 없이 즉시 배포 가능
- Express.js 서버 그대로 사용
- MySQL 직접 연결

**Workers 마이그레이션은 다음 경우에 고려:**
- 모든 것을 Cloudflare에서 관리하고 싶을 때
- 글로벌 CDN의 이점을 활용하고 싶을 때
- 코드 리팩토링에 시간을 투자할 수 있을 때

