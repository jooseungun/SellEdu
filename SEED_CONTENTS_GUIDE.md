# 콘텐츠 데이터 시드 가이드

## 1. 판매자 계정 생성

먼저 `joosu` 판매자 계정을 생성해야 합니다.

1. 회원가입 페이지에서 다음 정보로 가입:
   - 아이디: `joosu`
   - 이메일: `joosu@selledu.com`
   - 비밀번호: 원하는 비밀번호
   - 이름: `조수`
   - 휴대폰: `010-0000-0000`
   - 역할: 자동으로 `buyer`로 설정됨

2. 관리자 페이지에서 `joosu` 계정의 역할을 `seller`로 변경:
   - 관리자 로그인 (`admin` / `admin`)
   - 회원 관리 탭
   - `joosu` 계정 찾기
   - "역할 변경" 버튼 클릭
   - 역할을 "판매자"로 변경

## 2. 콘텐츠 테이블 생성

데이터베이스 초기화 API를 호출하여 콘텐츠 테이블을 생성합니다.

브라우저 콘솔에서 실행:

```javascript
fetch('https://selledu.pages.dev/api/v1/admin/init-db', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('성공:', data);
  alert('데이터베이스 초기화 완료!');
})
.catch(err => {
  console.error('오류:', err);
  alert('오류 발생: ' + err.message);
});
```

## 3. 콘텐츠 데이터 삽입

가비지 데이터를 DB에 삽입합니다.

브라우저 콘솔에서 실행:

```javascript
fetch('https://selledu.pages.dev/api/v1/admin/seed-contents', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => {
  console.log('성공:', data);
  alert(`콘텐츠 데이터 삽입 완료! (${data.inserted}/${data.total})`);
})
.catch(err => {
  console.error('오류:', err);
  alert('오류 발생: ' + err.message);
});
```

## 4. 확인

구매자 페이지(`/buyer`)에서 콘텐츠가 DB에서 로드되는지 확인합니다.

## 문제 해결

### "판매자 계정 joosu를 찾을 수 없습니다" 오류
- `joosu` 계정이 회원가입되어 있는지 확인
- 관리자 페이지에서 역할이 `seller`로 변경되었는지 확인

### "콘텐츠 테이블이 없습니다" 오류
- 데이터베이스 초기화 API를 먼저 실행했는지 확인
- D1 데이터베이스 콘솔에서 `contents` 테이블이 생성되었는지 확인

