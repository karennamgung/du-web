-- academies 테이블에 주소 정규화 컬럼 추가 (위치 선택 필터용)
-- address, address_road는 표시용 그대로 두고, 필터만 이 컬럼 사용 (address.ts 포맷: 시/도, 구/군/시, 동/면)
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_sido text;
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_gugun text;
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_dong text;

COMMENT ON COLUMN public.academies.address_sido IS '주소 정규화: 시/도 (address.ts 포맷, 필터용)';
COMMENT ON COLUMN public.academies.address_gugun IS '주소 정규화: 구/군/시 (필터용)';
COMMENT ON COLUMN public.academies.address_dong IS '주소 정규화: 동/면 (필터용, 없으면 구/군 전체)';
