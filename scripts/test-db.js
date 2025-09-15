#!/usr/bin/env node

/**
 * Supabase 데이터베이스 연결 테스트 스크립트
 * 
 * 사용법:
 * 1. .env.local 파일에 환경 변수 설정
 * 2. node scripts/test-db.js 실행
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function testDatabaseConnection() {
  console.log('🔍 Supabase 데이터베이스 연결 테스트 시작...\n');

  // 환경 변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다.');
    console.error('   .env.local 파일에 다음을 추가하세요:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key');
    process.exit(1);
  }

  console.log('✅ 환경 변수 확인 완료');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...\n`);

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase 클라이언트 생성 완료');

    // 연결 테스트 - 간단한 쿼리 실행
    console.log('🔍 데이터베이스 연결 테스트 중...');
    const { data, error } = await supabase
      .from('families')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ 데이터베이스 연결 실패:', error.message);
      process.exit(1);
    }

    console.log('✅ 데이터베이스 연결 성공!\n');

    // 테이블 존재 여부 확인
    console.log('🔍 테이블 존재 여부 확인 중...');
    
    const tables = ['families', 'spending', 'recurring_spending'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table} 테이블 접근 실패:`, error.message);
        } else {
          console.log(`✅ ${table} 테이블 접근 성공`);
        }
      } catch (err) {
        console.log(`❌ ${table} 테이블 확인 중 오류:`, err.message);
      }
    }

    console.log('\n🔍 샘플 데이터 확인 중...');
    
    // families 테이블 데이터 확인
    const { data: families, error: familiesError } = await supabase
      .from('families')
      .select('*')
      .limit(5);

    if (familiesError) {
      console.log('❌ families 테이블 데이터 조회 실패:', familiesError.message);
    } else {
      console.log(`✅ families 테이블: ${families.length}개 레코드`);
      if (families.length > 0) {
        console.log('   샘플 데이터:', families[0]);
      }
    }

    // spending 테이블 데이터 확인
    const { data: spendings, error: spendingsError } = await supabase
      .from('spending')
      .select('*')
      .limit(5);

    if (spendingsError) {
      console.log('❌ spending 테이블 데이터 조회 실패:', spendingsError.message);
    } else {
      console.log(`✅ spending 테이블: ${spendings.length}개 레코드`);
      if (spendings.length > 0) {
        console.log('   샘플 데이터:', spendings[0]);
      }
    }

    console.log('\n🎉 모든 테스트가 완료되었습니다!');
    console.log('   이제 애플리케이션을 실행할 수 있습니다.');

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };
