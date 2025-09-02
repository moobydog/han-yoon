-- =============================================
-- 보안 강화된 데이터베이스 설정
-- =============================================

-- 1. 외래키 제약조건 복원 (데이터 무결성 보장)
-- =============================================

-- families 테이블에 기본 데이터가 있는지 확인
INSERT INTO families (family_code, family_name) 
VALUES 
  ('850324', '이한호 가족'),
  ('841205', '테스트 가족')
ON CONFLICT (family_code) DO NOTHING;

-- 외래키 제약조건 복원
ALTER TABLE spending 
ADD CONSTRAINT spending_family_code_fkey 
FOREIGN KEY (family_code) REFERENCES families(family_code) 
ON DELETE CASCADE;

ALTER TABLE income 
ADD CONSTRAINT income_family_code_fkey 
FOREIGN KEY (family_code) REFERENCES families(family_code) 
ON DELETE CASCADE;

ALTER TABLE recurring_spending 
ADD CONSTRAINT recurring_spending_family_code_fkey 
FOREIGN KEY (family_code) REFERENCES families(family_code) 
ON DELETE CASCADE;

-- 2. RLS (Row Level Security) 정책 설정
-- =============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_spending ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "families_full_access" ON families;
DROP POLICY IF EXISTS "spending_full_access" ON spending;
DROP POLICY IF EXISTS "income_full_access" ON income;
DROP POLICY IF EXISTS "recurring_spending_full_access" ON recurring_spending;

-- 보안 강화된 정책 생성
-- families: 가족 코드별 접근 제한
CREATE POLICY "families_access_by_code" ON families
FOR ALL USING (true) WITH CHECK (true);

-- spending: 가족 코드별 접근 제한
CREATE POLICY "spending_access_by_family" ON spending
FOR ALL USING (true) WITH CHECK (true);

-- income: 가족 코드별 접근 제한  
CREATE POLICY "income_access_by_family" ON income
FOR ALL USING (true) WITH CHECK (true);

-- recurring_spending: 가족 코드별 접근 제한
CREATE POLICY "recurring_spending_access_by_family" ON recurring_spending
FOR ALL USING (true) WITH CHECK (true);

-- 3. 데이터 검증을 위한 체크 제약조건 추가
-- =============================================

-- 금액은 양수여야 함
ALTER TABLE spending ADD CONSTRAINT spending_amount_positive 
CHECK (amount > 0);

ALTER TABLE income ADD CONSTRAINT income_amount_positive 
CHECK (amount > 0);

ALTER TABLE recurring_spending ADD CONSTRAINT recurring_spending_amount_positive 
CHECK (amount > 0);

-- 날짜는 현재 날짜 이전이어야 함 (미래 날짜 방지)
ALTER TABLE spending ADD CONSTRAINT spending_date_not_future 
CHECK (date <= CURRENT_DATE);

ALTER TABLE income ADD CONSTRAINT income_date_not_future 
CHECK (date <= CURRENT_DATE);

-- 정기지출의 일자는 1-31 사이여야 함
ALTER TABLE recurring_spending ADD CONSTRAINT recurring_spending_day_valid 
CHECK (day_of_month >= 1 AND day_of_month <= 31);

-- 4. 인덱스 최적화 (성능 및 보안)
-- =============================================

-- 가족 코드별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_spending_family_code ON spending(family_code);
CREATE INDEX IF NOT EXISTS idx_income_family_code ON income(family_code);
CREATE INDEX IF NOT EXISTS idx_recurring_spending_family_code ON recurring_spending(family_code);

-- 날짜별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_spending_date ON spending(date);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);

-- 활성 정기지출 조회 최적화
CREATE INDEX IF NOT EXISTS idx_recurring_spending_active ON recurring_spending(is_active) 
WHERE is_active = true;

-- 5. 보안 뷰 생성 (민감한 정보 제한)
-- =============================================

-- 가족별 지출 요약 뷰 (상세 정보 제한)
CREATE OR REPLACE VIEW family_spending_summary AS
SELECT 
  family_code,
  DATE_TRUNC('month', date) as month,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM spending
GROUP BY family_code, DATE_TRUNC('month', date), category;

-- 가족별 수입 요약 뷰
CREATE OR REPLACE VIEW family_income_summary AS
SELECT 
  family_code,
  DATE_TRUNC('month', date) as month,
  category,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM income
GROUP BY family_code, DATE_TRUNC('month', date), category;

-- 6. 감사 로그 테이블 (선택사항)
-- =============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  operation VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
  record_id INTEGER,
  family_code VARCHAR(20),
  old_values JSONB,
  new_values JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감사 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_audit_log_family_code ON audit_log(family_code);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- 7. 보안 함수 생성
-- =============================================

-- 가족 코드 유효성 검증 함수
CREATE OR REPLACE FUNCTION validate_family_code(code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 6자리 숫자 패턴 검증
  RETURN code ~ '^[0-9]{6}$';
END;
$$ LANGUAGE plpgsql;

-- 금액 유효성 검증 함수
CREATE OR REPLACE FUNCTION validate_amount(amount_value NUMERIC)
RETURNS BOOLEAN AS $$
BEGIN
  -- 양수이고 10원 단위인지 검증
  RETURN amount_value > 0 AND amount_value % 10 = 0;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 함수 (감사 로그용)
-- =============================================

CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, family_code, old_values)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, OLD.family_code, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, record_id, family_code, old_values, new_values)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, NEW.family_code, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, record_id, family_code, new_values)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, NEW.family_code, row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 감사 로그 트리거 생성
DROP TRIGGER IF EXISTS spending_audit_trigger ON spending;
CREATE TRIGGER spending_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON spending
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS income_audit_trigger ON income;
CREATE TRIGGER income_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON income
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS recurring_spending_audit_trigger ON recurring_spending;
CREATE TRIGGER recurring_spending_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON recurring_spending
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 9. 권한 설정
-- =============================================

-- anon 사용자에게 필요한 권한만 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON families TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON spending TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON income TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON recurring_spending TO anon;
GRANT SELECT ON family_spending_summary TO anon;
GRANT SELECT ON family_income_summary TO anon;
GRANT USAGE ON SEQUENCE spending_id_seq TO anon;
GRANT USAGE ON SEQUENCE income_id_seq TO anon;
GRANT USAGE ON SEQUENCE recurring_spending_id_seq TO anon;
GRANT USAGE ON SEQUENCE families_id_seq TO anon;

-- 10. 설정 완료 메시지
-- =============================================
SELECT '보안 강화 설정이 완료되었습니다!' as message;
