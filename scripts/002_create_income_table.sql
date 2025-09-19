-- 수입 테이블 생성
CREATE TABLE IF NOT EXISTS public.income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date TEXT NOT NULL,
  earner TEXT NOT NULL,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  family_code TEXT NOT NULL
);

-- Row Level Security 활성화
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (family_code 기반)
CREATE POLICY "Allow family members to view income" 
  ON public.income FOR SELECT 
  USING (family_code IN (
    SELECT family_code FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Allow family members to insert income" 
  ON public.income FOR INSERT 
  WITH CHECK (family_code IN (
    SELECT family_code FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Allow family members to update income" 
  ON public.income FOR UPDATE 
  USING (family_code IN (
    SELECT family_code FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Allow family members to delete income" 
  ON public.income FOR DELETE 
  USING (family_code IN (
    SELECT family_code FROM profiles WHERE id = auth.uid()
  ));
