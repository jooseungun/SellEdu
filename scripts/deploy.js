#!/usr/bin/env node

// 자동 커밋 및 배포 스크립트 (Node.js)

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function execCommand(command, options = {}) {
  try {
    const defaultOptions = {
      stdio: 'inherit',
      encoding: 'utf-8',
      env: { ...process.env, LANG: 'ko_KR.UTF-8', LC_ALL: 'ko_KR.UTF-8' }
    };
    execSync(command, { ...defaultOptions, ...options });
    return true;
  } catch (error) {
    console.error(`❌ 오류 발생: ${error.message}`);
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

async function main() {
  console.log('🔄 변경사항 확인 중...\n');

  if (!checkChanges()) {
    console.log('✅ 변경사항이 없습니다.');
    rl.close();
    return;
  }

  // 변경사항 표시
  console.log('📋 변경된 파일:');
  execCommand('git status --short');
  console.log('');

  // 커밋 메시지 입력
  const commitMessage = process.argv[2] || await new Promise((resolve) => {
    rl.question('📝 커밋 메시지를 입력하세요 (또는 Enter로 기본 메시지 사용): ', (answer) => {
      resolve(answer || `자동 커밋: ${new Date().toLocaleString('ko-KR')}`);
    });
  });

  rl.close();

  console.log('\n📦 변경사항 스테이징 중...');
  if (!execCommand('git add -A')) {
    process.exit(1);
  }

  console.log('💾 커밋 중...');
  // 커밋 메시지를 안전하게 전달하기 위해 환경 변수 사용
  const commitCmd = process.platform === 'win32' 
    ? `git -c i18n.commitencoding=utf-8 commit -m "${commitMessage.replace(/"/g, '\\"')}"`
    : `git -c i18n.commitencoding=utf-8 commit -m "${commitMessage}"`;
  if (!execCommand(commitCmd)) {
    process.exit(1);
  }

  console.log('🚀 원격 저장소로 푸시 중...');
  if (!execCommand('git push origin main')) {
    process.exit(1);
  }

  console.log('\n✅ 커밋 및 푸시 완료!');
  console.log('📡 Cloudflare Pages가 자동으로 배포를 시작합니다...');
}

main().catch(console.error);

