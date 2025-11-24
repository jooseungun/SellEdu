#!/bin/bash

# 자동 커밋 및 배포 스크립트

set -e

echo "🔄 변경사항 확인 중..."

# 변경사항이 있는지 확인
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ 변경사항이 없습니다."
    exit 0
fi

# 커밋 메시지 입력
if [ -z "$1" ]; then
    echo "📝 커밋 메시지를 입력하세요 (또는 기본 메시지 사용):"
    read -r commit_message
    if [ -z "$commit_message" ]; then
        commit_message="자동 커밋: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
else
    commit_message="$1"
fi

echo "📦 변경사항 스테이징 중..."
git add -A

echo "💾 커밋 중..."
git commit -m "$commit_message"

echo "🚀 원격 저장소로 푸시 중..."
git push origin main

echo "✅ 커밋 및 푸시 완료!"
echo "📡 Cloudflare Pages가 자동으로 배포를 시작합니다..."

