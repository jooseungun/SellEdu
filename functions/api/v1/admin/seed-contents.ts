// Cloudflare Pages Function for seeding contents data
// 가비지 데이터를 DB에 삽입

export async function onRequestPost({ request, env }: {
  request: Request;
  env: {
    DB: D1Database;
  };
}): Promise<Response> {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  try {
    if (!env || !env.DB) {
      return new Response(
        JSON.stringify({ error: 'D1 데이터베이스 바인딩이 설정되지 않았습니다.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // joosu 판매자 계정 찾기, 없으면 생성
    let joosuSeller = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    )
      .bind('joosu')
      .first<{ id: number }>();

    let joosuSellerId: number;
    
    if (!joosuSeller) {
      // joosu 계정이 없으면 생성
      const encoder = new TextEncoder();
      const data = encoder.encode('joosu123'); // 기본 비밀번호
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const result = await env.DB.prepare(
        `INSERT INTO users (username, email, password_hash, name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind('joosu', 'joosu@selledu.com', passwordHash, '조수', 'seller')
        .run();
      
      joosuSellerId = result.meta.last_row_id;
      
      // seller 테이블에 레코드 생성
      await env.DB.prepare(
        `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount, recent_months)
         VALUES (?, 'BRONZE', 10.00, 0.00, 0.00, 3)`
      )
        .bind(joosuSellerId)
        .run();
    } else {
      joosuSellerId = joosuSeller.id;
    }

    // jooss 판매자 계정 찾기, 없으면 생성
    let joossSeller = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    )
      .bind('jooss')
      .first<{ id: number }>();

    let joossSellerId: number;
    
    if (!joossSeller) {
      // jooss 계정이 없으면 생성
      const encoder = new TextEncoder();
      const data = encoder.encode('jooss123'); // 기본 비밀번호
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      const result = await env.DB.prepare(
        `INSERT INTO users (username, email, password_hash, name, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
      )
        .bind('jooss', 'jooss@selledu.com', passwordHash, '조쓰', 'seller')
        .run();
      
      joossSellerId = result.meta.last_row_id;
      
      // seller 테이블에 레코드 생성
      await env.DB.prepare(
        `INSERT INTO sellers (user_id, grade, commission_rate, total_sales_amount, recent_sales_amount, recent_months)
         VALUES (?, 'BRONZE', 10.00, 0.00, 0.00, 3)`
      )
        .bind(joossSellerId)
        .run();
    } else {
      joossSellerId = joossSeller.id;
    }

    // 가비지 데이터
    const contentsData = [
      { title: '프로젝트 관리 실무', description: '실무에서 바로 활용할 수 있는 프로젝트 관리 방법론을 학습합니다.', category: '전문직무', price: 9900, grade: '베이직', age: 'All', duration: 60 },
      { title: '데이터 분석 기초', description: '데이터 분석의 기초부터 고급 기법까지 체계적으로 배웁니다.', category: 'IT', price: 14900, grade: '프리미엄', age: 'All', duration: 90 },
      { title: 'Python 프로그래밍', description: 'Python 프로그래밍 언어의 기초부터 실전 프로젝트까지 진행합니다.', category: 'IT', price: 19900, grade: '스탠다드', age: 'All', duration: 120 },
      { title: '영어 회화 초급', description: '일상 회화부터 비즈니스 영어까지 단계별로 학습합니다.', category: '외국어', price: 24900, grade: '개별구매', age: 'All', duration: 90 },
      { title: '토익 700점 달성', description: '토익 700점 달성을 위한 체계적인 학습 커리큘럼입니다.', category: '어학', price: 29900, grade: '베이직', age: 'All', duration: 150 },
      { title: '경영 전략 수립', description: '경영 전략 수립의 이론과 실무를 함께 학습합니다.', category: '경영직무', price: 9900, grade: '프리미엄', age: 'All', duration: 120 },
      { title: '마케팅 기초', description: '마케팅의 기초 개념부터 디지털 마케팅까지 다룹니다.', category: '경영일반', price: 14900, grade: '스탠다드', age: 'All', duration: 90 },
      { title: '인사 관리 실무', description: '인사 관리의 실무 노하우를 배웁니다.', category: '공통직무', price: 19900, grade: '개별구매', age: 'All', duration: 60 },
      { title: '회계 원리', description: '회계의 기본 원리를 이해하고 실무에 적용합니다.', category: '경영일반', price: 24900, grade: '베이직', age: 'All', duration: 120 },
      { title: '세무 실무', description: '세무 실무의 핵심을 학습합니다.', category: '법정교육', price: 29900, grade: '프리미엄', age: 'All', duration: 90 },
      { title: '정보보안 기초', description: '정보보안의 기초 개념과 실무를 학습합니다.', category: 'IT', price: 9900, grade: '스탠다드', age: 'All', duration: 150 },
      { title: '클라우드 컴퓨팅', description: '클라우드 컴퓨팅의 개념과 활용 방법을 배웁니다.', category: 'IT', price: 14900, grade: '개별구매', age: 'All', duration: 120 },
      { title: '웹 개발 입문', description: '웹 개발의 기초부터 실전 프로젝트까지 진행합니다.', category: 'IT', price: 19900, grade: '베이직', age: 'All', duration: 90 },
      { title: '데이터베이스 설계', description: '데이터베이스 설계의 원리와 실무를 학습합니다.', category: 'IT', price: 24900, grade: '프리미엄', age: 'All', duration: 120 },
      { title: '네트워크 기초', description: '네트워크의 기초 개념을 이해합니다.', category: 'IT', price: 29900, grade: '스탠다드', age: 'All', duration: 60 },
      { title: '인문학 특강', description: '인문학적 사고를 기르는 특강입니다.', category: '인문교양', price: 9900, grade: '개별구매', age: 'All', duration: 90 },
      { title: '문학 감상법', description: '문학 작품을 깊이 있게 감상하는 방법을 배웁니다.', category: '인문교양', price: 14900, grade: '베이직', age: 'All', duration: 120 },
      { title: '역사 이해', description: '역사를 통해 현재를 이해합니다.', category: '인문교양', price: 19900, grade: '프리미엄', age: 'All', duration: 90 },
      { title: '철학 입문', description: '철학의 기본 개념을 이해합니다.', category: '인문교양', price: 24900, grade: '스탠다드', age: 'All', duration: 150 },
      { title: '예술 감상', description: '예술 작품을 감상하는 방법을 배웁니다.', category: '인문교양', price: 29900, grade: '개별구매', age: 'All', duration: 60 },
      { title: '자격증 준비반', description: '자격증 취득을 위한 체계적인 준비 과정입니다.', category: '자격증', price: 9900, grade: '베이직', age: 'All', duration: 120 },
      { title: '공인중개사', description: '공인중개사 자격증 취득을 위한 강의입니다.', category: '자격증', price: 14900, grade: '프리미엄', age: 'All', duration: 90 },
      { title: '회계사', description: '회계사 자격증 취득을 위한 강의입니다.', category: '자격증', price: 19900, grade: '스탠다드', age: 'All', duration: 150 },
      { title: '변호사', description: '변호사 자격증 취득을 위한 강의입니다.', category: '자격증', price: 24900, grade: '개별구매', age: 'All', duration: 120 },
      { title: '의사', description: '의사 국가고시 준비를 위한 강의입니다.', category: '자격증', price: 29900, grade: '베이직', age: 'All', duration: 90 },
      { title: '산업기술 특강', description: '산업기술의 최신 동향을 학습합니다.', category: '산업기술지식', price: 9900, grade: '프리미엄', age: 'All', duration: 60 },
      { title: '4차 산업혁명', description: '4차 산업혁명의 핵심 기술을 이해합니다.', category: '산업기술지식', price: 14900, grade: '스탠다드', age: 'All', duration: 120 },
      { title: 'AI 기초', description: '인공지능의 기초 개념을 학습합니다.', category: 'IT', price: 19900, grade: '개별구매', age: 'All', duration: 90 },
      { title: '빅데이터 분석', description: '빅데이터 분석 방법을 배웁니다.', category: 'IT', price: 24900, grade: '베이직', age: 'All', duration: 150 },
      { title: '블록체인 이해', description: '블록체인 기술의 원리와 활용을 이해합니다.', category: 'IT', price: 29900, grade: '프리미엄', age: 'All', duration: 60 },
      { title: 'React 고급 개발', description: 'React의 고급 패턴과 최적화 기법을 학습합니다.', category: 'IT', price: 34900, grade: '스탠다드', age: 'All', duration: 180 },
      { title: 'Node.js 백엔드 개발', description: 'Node.js를 활용한 서버 사이드 개발을 학습합니다.', category: 'IT', price: 39900, grade: '프리미엄', age: 'All', duration: 200 }
    ];

    // 기존 콘텐츠 개수 확인 (joosu와 jooss 모두)
    const existingCountJoosu = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE seller_id = ?'
    )
      .bind(joosuSellerId)
      .first<{ count: number }>();

    const existingCountJooss = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM contents WHERE seller_id = ?'
    )
      .bind(joossSellerId)
      .first<{ count: number }>();

    if ((existingCountJoosu && existingCountJoosu.count > 0) || (existingCountJooss && existingCountJooss.count > 0)) {
      return new Response(
        JSON.stringify({
          message: '이미 콘텐츠 데이터가 존재합니다.',
          joosu: existingCountJoosu?.count || 0,
          jooss: existingCountJooss?.count || 0,
          skipped: true
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < contentsData.length; i++) {
      const content = contentsData[i];
      // 콘텐츠 1-30은 joosu, 31-32는 jooss 소유
      const currentSellerId = i < 30 ? joosuSellerId : joossSellerId;
      
      try {
        // 중복 체크: 같은 제목의 콘텐츠가 이미 있는지 확인
        const existing = await env.DB.prepare(
          'SELECT id FROM contents WHERE seller_id = ? AND title = ?'
        )
          .bind(currentSellerId, content.title)
          .first<{ id: number }>();

        if (existing) {
          console.log(`콘텐츠 "${content.title}"는 이미 존재합니다. 건너뜁니다.`);
          continue;
        }

        const result = await env.DB.prepare(
          `INSERT INTO contents (
            seller_id, title, description, thumbnail_url, price, category, 
            grade, age_rating, status, purchase_count, avg_rating, review_count, 
            duration, education_period, display_order, created_at, updated_at, approved_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, 999, ?, datetime('now'), datetime('now'), datetime('now'))`
        )
          .bind(
            currentSellerId,
            content.title,
            content.description,
            null, // 기본 썸네일 사용
            content.price,
            content.category,
            content.grade,
            content.age,
            0, // purchase_count: 더미 데이터 제거
            null, // avg_rating: 더미 데이터 제거 (NULL)
            0, // review_count: 더미 데이터 제거
            content.duration,
            i + 1
          )
          .run();

        insertedCount++;
      } catch (error: any) {
        errors.push(`${content.title}: ${error.message}`);
        console.error(`콘텐츠 "${content.title}" 삽입 실패:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        message: '콘텐츠 데이터 삽입 완료',
        inserted: insertedCount,
        total: contentsData.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Seed contents error:', error);
    return new Response(
      JSON.stringify({
        error: '콘텐츠 데이터 삽입 중 오류가 발생했습니다.',
        details: error.message || 'Unknown error'
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

