#!/usr/bin/env node

// 파일 변경 감지 및 자동 커밋 스크립트
// 사용법: node scripts/auto-commit-watch.js

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let isCommitting = false;
let changeTimeout = null;

function execCommand(command, silent = false) {
  try {
    const options = {
      encoding: 'utf-8',
      env: { ...process.env, LANG: 'ko_KR.UTF-8', LC_ALL: 'ko_KR.UTF-8' }
    };
    if (silent) {
      execSync(command, { ...options, stdio: 'ignore' });
    } else {
      execSync(command, { ...options, stdio: 'inherit' });
    }
    return true;
  } catch (error) {
    if (!silent) {
      console.error(`❌ 오류 발생: ${error.message}`);
    }
    return false;
  }
}

function checkChanges() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    return status.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function autoCommit() {
  if (isCommitting) {
    return;
  }

  if (!checkChanges()) {
    return;
  }

  isCommitting = true;
  console.log('\n📦 변경사항 감지! 자동 커밋 시작...\n');

  // 변경사항 표시
  try {
    const status = execSync('git status --short', { encoding: 'utf-8' });
    console.log('📋 변경된 파일:');
    console.log(status);
  } catch (error) {
    // 무시
  }

  // 자동 커밋 메시지 생성
  const timestamp = new Date().toLocaleString('ko-KR');
  const commitMessage = `자동 커밋: ${timestamp}`;

  console.log(`💾 커밋 메시지: ${commitMessage}\n`);

  // 스테이징
  if (!execCommand('git add -A', true)) {
    isCommitting = false;
    return;
  }

  // 커밋 (UTF-8 인코딩 명시)
  const commitCmd = process.platform === 'win32' 
    ? `git -c i18n.commitencoding=utf-8 commit -m "${commitMessage.replace(/"/g, '\\"')}"`
    : `git -c i18n.commitencoding=utf-8 commit -m "${commitMessage}"`;
  if (!execCommand(commitCmd, true)) {
    isCommitting = false;
    return;
  }

  console.log('✅ 자동 커밋 완료!');

  // 푸시
  console.log('🚀 원격 저장소로 푸시 중...');
  if (execCommand('git push origin main', true)) {
    console.log('✅ 푸시 완료! Cloudflare Pages가 자동으로 배포를 시작합니다...\n');
  } else {
    console.log('⚠️ 푸시 실패 (나중에 수동으로 푸시하세요)\n');
  }

  isCommitting = false;
}

// 파일 변경 감지 (간단한 방식 - 주기적 체크)
function watchChanges() {
  console.log('👀 파일 변경 감지 모드 활성화...');
  console.log('💡 변경사항이 감지되면 자동으로 커밋하고 배포합니다.\n');

  // 5초마다 변경사항 체크
  setInterval(() => {
    if (checkChanges() && !isCommitting) {
      // 변경사항이 있으면 3초 후에 커밋 (여러 파일 변경 대기)
      if (changeTimeout) {
        clearTimeout(changeTimeout);
      }
      
      changeTimeout = setTimeout(() => {
        autoCommit();
      }, 3000);
    }
  }, 5000);
}

// 시작
watchChanges();

