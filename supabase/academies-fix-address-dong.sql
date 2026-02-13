-- address_dong이 NULL로 덮어써진 행 복구 (인천 연수구 송도만; 논현동은 남동구 → academies-fix-nonhyeon-to-namdong.sql 사용)
-- Supabase SQL Editor에서 실행

-- 인천 연수구 + 송도 → address_dong = '송도동'
UPDATE public.academies
SET address_dong = '송도동'
WHERE address_sido = '인천' AND address_gugun = '연수구'
  AND (address LIKE '%송도%' OR address_road LIKE '%송도%');
