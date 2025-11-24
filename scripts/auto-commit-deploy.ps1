# 자동 커밋 및 배포 스크립트 (PowerShell)

Write-Host "🔄 변경사항 확인 중..." -ForegroundColor Cyan

# 변경사항이 있는지 확인
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ 변경사항이 없습니다." -ForegroundColor Green
    exit 0
}

# 커밋 메시지 입력
$commitMessage = $args[0]
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = Read-Host "📝 커밋 메시지를 입력하세요 (또는 Enter로 기본 메시지 사용)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "자동 커밋: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
}

Write-Host "📦 변경사항 스테이징 중..." -ForegroundColor Yellow
git add -A

Write-Host "💾 커밋 중..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host "🚀 원격 저장소로 푸시 중..." -ForegroundColor Yellow
git push origin main

Write-Host "✅ 커밋 및 푸시 완료!" -ForegroundColor Green
Write-Host "📡 Cloudflare Pages가 자동으로 배포를 시작합니다..." -ForegroundColor Cyan

