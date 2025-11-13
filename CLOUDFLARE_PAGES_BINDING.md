# Cloudflare Pages D1 바인딩 설정

## 자동 설정 방법

Cloudflare Pages는 `wrangler.toml` 파일의 D1 바인딩 설정을 자동으로 읽습니다.

현재 `wrangler.toml`에 다음 설정이 포함되어 있습니다:

```toml
[[d1_databases]]
binding = "DB"
database_name = "selledu-db"
database_id = "YOUR_D1_DATABASE_ID"
```

## 수동 설정 방법 (대시보드)

1. Cloudflare 대시보드 > Pages > 프로젝트 선택
2. Settings > Functions
3. D1 Database bindings 섹션:
   - Variable name: `DB`
   - D1 Database: `selledu-db` 선택
4. Save

## 데이터베이스 ID 업데이트

1. D1 데이터베이스 페이지 > Settings
2. Database ID 복사
3. `wrangler.toml`의 `database_id` 값 업데이트

