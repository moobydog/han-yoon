-- 결제 방법 컬럼 추가
ALTER TABLE spending ADD COLUMN payment_method TEXT DEFAULT 'card';

-- 결제 방법 컬럼 추가 (정기지출 테이블)
ALTER TABLE recurring_spending ADD COLUMN payment_method TEXT DEFAULT 'card';

-- 기존 데이터에 기본값 설정
UPDATE spending SET payment_method = 'card' WHERE payment_method IS NULL;
UPDATE recurring_spending SET payment_method = 'card' WHERE payment_method IS NULL;

-- 결제 방법 제약 조건 추가
ALTER TABLE spending ADD CONSTRAINT check_payment_method 
  CHECK (payment_method IN ('card', 'cash', 'transfer'));

ALTER TABLE recurring_spending ADD CONSTRAINT check_payment_method 
  CHECK (payment_method IN ('card', 'cash', 'transfer'));
