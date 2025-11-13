# GitHub Actions 배포 오류 해결 방법

## 문제
GitHub Actions에서 "Input required and not supplied: apiToken" 오류가 발생합니다.

## 원인
GitHub Actions 워크플로우에서 Cloudflare API 토큰이 필요한데, GitHub Secrets에 설정되지 않았습니다.

## 해결 방법

### 방법 1: GitHub Actions 비활성화 (권장)
Cloudflare Pages가 이미 Git과 직접 연동되어 있다면, GitHub Actions 워크플로우는 필요 없습니다.

**Cloudflare Pages가 Git 연동으로 자동 배포를 관리하므로, GitHub Actions를 비활성화하는 것이 좋습니다.**

워크플로우 파일을 삭제하거나 비활성화:
```bash
# .github/workflows/cloudflare-pages.yml 파일 삭제 또는
# on: 섹션을 workflow_dispatch로 변경 (수동 실행만 가능)
```

### 방법 2: GitHub Secrets 설정 (GitHub Actions를 사용하려는 경우)

만약 GitHub Actions를 통해 배포하고 싶다면:

1. **Cloudflare API 토큰 생성**
   - Cloudflare 대시보드 접속: https://dash.cloudflare.com/profile/api-tokens
   - "Create Token" 클릭
   - "Edit Cloudflare Workers" 템플릿 선택
   - 권한 설정:
     - Account: Cloudflare Pages: Edit
     - Zone: 필요 없음
   - 토큰 생성 및 복사

2. **Cloudflare Account ID 확인**
   - Cloudflare 대시보드 우측 사이드바에서 Account ID 확인

3. **GitHub Secrets 설정**
   - GitHub 저장소 → Settings → Secrets and variables → Actions
   - 다음 Secrets 추가:
     - `CLOUDFLARE_API_TOKEN`: 위에서 생성한 API 토큰
     - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

4. **워크플로우 활성화**
   - `.github/workflows/cloudflare-pages.yml` 파일에서 주석 처리된 부분 해제

## 현재 상태
- Cloudflare Pages는 Git 연동으로 자동 배포 중
- GitHub Actions 워크플로우는 비활성화됨 (필요시 수동 실행 가능)

## 참고
Cloudflare Pages의 Git 연동이 이미 설정되어 있다면, GitHub Actions는 필요하지 않습니다. 
Cloudflare Pages가 push 이벤트를 감지하여 자동으로 빌드하고 배포합니다.

