-- Create families table
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_code TEXT UNIQUE NOT NULL,
  member1 TEXT NOT NULL,
  member2 TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spending table
CREATE TABLE IF NOT EXISTS public.spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_code TEXT NOT NULL REFERENCES public.families(family_code) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  spender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recurring_spending table
CREATE TABLE IF NOT EXISTS public.recurring_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_code TEXT NOT NULL REFERENCES public.families(family_code) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_spending_family_code ON public.spending(family_code);
CREATE INDEX IF NOT EXISTS idx_spending_date ON public.spending(date);
CREATE INDEX IF NOT EXISTS idx_recurring_spending_family_code ON public.recurring_spending(family_code);
CREATE INDEX IF NOT EXISTS idx_recurring_spending_day ON public.recurring_spending(day_of_month);
