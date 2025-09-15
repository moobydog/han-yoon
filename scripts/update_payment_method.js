const { createClient } = require('@supabase/supabase-js')

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePaymentMethod() {
  try {
    console.log('🔍 payment_method 컬럼 추가 중...')
    
    // payment_method 컬럼 추가
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE spending ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
        ALTER TABLE recurring_spending ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
      `
    })
    
    if (alterError) {
      console.error('❌ 컬럼 추가 실패:', alterError)
      return
    }
    
    console.log('✅ payment_method 컬럼 추가 완료')
    
    // 기존 데이터에 기본값 설정
    console.log('🔍 기존 데이터 업데이트 중...')
    
    const { error: updateSpendingError } = await supabase
      .from('spending')
      .update({ payment_method: 'card' })
      .is('payment_method', null)
    
    if (updateSpendingError) {
      console.error('❌ spending 테이블 업데이트 실패:', updateSpendingError)
    } else {
      console.log('✅ spending 테이블 업데이트 완료')
    }
    
    const { error: updateRecurringError } = await supabase
      .from('recurring_spending')
      .update({ payment_method: 'card' })
      .is('payment_method', null)
    
    if (updateRecurringError) {
      console.error('❌ recurring_spending 테이블 업데이트 실패:', updateRecurringError)
    } else {
      console.log('✅ recurring_spending 테이블 업데이트 완료')
    }
    
    console.log('🎉 payment_method 컬럼 추가 및 데이터 업데이트 완료!')
    
  } catch (error) {
    console.error('❌ 오류 발생:', error)
  }
}

updatePaymentMethod()
