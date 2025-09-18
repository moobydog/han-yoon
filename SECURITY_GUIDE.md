# 보안 가이드

## 1. 환경변수 설정

`.env.local` 파일에 다음 설정을 추가하세요:

\`\`\`bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# 보안 설정
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# API 보안 설정
API_RATE_LIMIT=100
API_TIMEOUT=30000

# 로깅 설정
LOG_LEVEL=warn
ENABLE_AUDIT_LOG=true
\`\`\`

## 2. 데이터베이스 보안 설정

`secure-database-setup.sql` 파일을 Supabase에서 실행하세요:

1. **외래키 제약조건 복원**: 데이터 무결성 보장
2. **RLS 정책 설정**: 행 수준 보안 활성화
3. **체크 제약조건**: 데이터 유효성 검증
4. **인덱스 최적화**: 성능 및 보안 향상
5. **감사 로그**: 모든 변경사항 추적

## 3. 보안 기능

### 입력값 검증
- 가족코드: 6자리 숫자만 허용
- 금액: 10원 단위, 1원~1억원 범위
- 사용자명: 20자 이하
- 메모: 200자 이하
- 날짜: 현재 날짜 이전만 허용

### XSS 방지
- 모든 문자열 입력에서 HTML 태그 제거
- 특수문자 필터링

### SQL 인젝션 방지
- Supabase 클라이언트 사용 (자동 이스케이프)
- 파라미터화된 쿼리 사용

### 데이터 접근 제어
- RLS 정책으로 가족별 데이터 격리
- 감사 로그로 모든 변경사항 추적

## 4. 운영 환경 보안 체크리스트

- [ ] 환경변수에서 실제 Supabase 키 설정
- [ ] `NODE_ENV=production` 설정
- [ ] `secure-database-setup.sql` 실행 완료
- [ ] HTTPS 사용 확인
- [ ] 정기적인 데이터베이스 백업
- [ ] 로그 모니터링 설정

## 5. 보안 모니터링

### 감사 로그 확인
\`\`\`sql
-- 최근 변경사항 확인
SELECT * FROM audit_log 
ORDER BY created_at DESC 
LIMIT 100;

-- 특정 가족의 활동 확인
SELECT * FROM audit_log 
WHERE family_code = '850324' 
ORDER BY created_at DESC;
\`\`\`

### 의심스러운 활동 감지
\`\`\`sql
-- 대량 삭제 시도 감지
SELECT * FROM audit_log 
WHERE operation = 'DELETE' 
AND created_at > NOW() - INTERVAL '1 hour';

-- 비정상적인 금액 입력 감지
SELECT * FROM spending 
WHERE amount > 10000000 
ORDER BY created_at DESC;
\`\`\`

## 6. 응급 상황 대응

### 데이터 복구
\`\`\`sql
-- 삭제된 데이터 복구 (감사 로그에서)
INSERT INTO spending (family_code, amount, description, category, date, spender)
SELECT 
  (old_values->>'family_code')::text,
  (old_values->>'amount')::numeric,
  (old_values->>'description')::text,
  (old_values->>'category')::text,
  (old_values->>'date')::date,
  (old_values->>'spender')::text
FROM audit_log 
WHERE table_name = 'spending' 
AND operation = 'DELETE' 
AND id = [삭제된_레코드_ID];
\`\`\`

### 보안 정책 재설정
\`\`\`sql
-- 모든 RLS 정책 재활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_spending ENABLE ROW LEVEL SECURITY;
\`\`\`
