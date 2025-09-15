-- Supabase 데이터베이스 스키마
-- 이 파일의 내용을 Supabase SQL Editor에서 실행하세요

-- 1. 가족 정보 테이블
CREATE TABLE IF NOT EXISTS families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_code TEXT NOT NULL UNIQUE,
  member1 TEXT NOT NULL,
  member2 TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 지출 내역 테이블
CREATE TABLE IF NOT EXISTS spending (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_code TEXT NOT NULL REFERENCES families(family_code) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  spender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 정기지출 테이블
CREATE TABLE IF NOT EXISTS recurring_spending (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_code TEXT NOT NULL REFERENCES families(family_code) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  spender TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN DEFAULT TRUE,
  last_processed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 수입 내역 테이블
CREATE TABLE IF NOT EXISTS income (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_code TEXT NOT NULL REFERENCES families(family_code) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  earner TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_spending_family_code ON spending(family_code);
CREATE INDEX IF NOT EXISTS idx_spending_date ON spending(date);
CREATE INDEX IF NOT EXISTS idx_spending_category ON spending(category);
CREATE INDEX IF NOT EXISTS idx_recurring_family_code ON recurring_spending(family_code);
CREATE INDEX IF NOT EXISTS idx_income_family_code ON income(family_code);
CREATE INDEX IF NOT EXISTS idx_income_date ON income(date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income(category);
CREATE INDEX IF NOT EXISTS idx_families_code ON families(family_code);

-- 6. RLS (Row Level Security) 설정
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE income ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책 설정 (모든 사용자가 읽기/쓰기 가능하도록 설정)
CREATE POLICY "Enable read access for all users" ON families FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON families FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON families FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON spending FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON spending FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON spending FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON spending FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON recurring_spending FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON recurring_spending FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON recurring_spending FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON recurring_spending FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON income FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON income FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON income FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON income FOR DELETE USING (true);

-- 7. 샘플 데이터 삽입 (테스트용)
INSERT INTO families (family_code, member1, member2) VALUES 
  ('FAMILY2025', '민수', '영희')
ON CONFLICT (family_code) DO NOTHING;

INSERT INTO spending (family_code, amount, category, description, spender) VALUES 
  ('FAMILY2025', 15000, '식비 - 외식', '점심 식사', '민수'),
  ('FAMILY2025', 8000, '교통비 - 대중교통', '지하철 요금', '영희'),
  ('FAMILY2025', 25000, '쇼핑 - 마트', '장보기', '민수')
ON CONFLICT DO NOTHING;

-- 8. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 트리거 생성
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spending_updated_at BEFORE UPDATE ON spending FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_spending_updated_at BEFORE UPDATE ON recurring_spending FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
