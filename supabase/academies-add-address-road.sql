-- academies 테이블에 도로명 주소 컬럼 추가 (address = 지번, address_road = 도로명)
ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS address_road text DEFAULT '';

COMMENT ON COLUMN public.academies.address IS '지번 주소';
COMMENT ON COLUMN public.academies.address_road IS '도로명 주소';
