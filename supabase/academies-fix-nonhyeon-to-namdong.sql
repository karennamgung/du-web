-- 인천 논현동은 남동구 소속. 연수구로 잘못 들어간 논현동 학원 주소를 남동구로 수정
-- Supabase SQL Editor에서 실행

UPDATE public.academies
SET
  address       = REPLACE(address, '인천 연수구 논현동', '인천 남동구 논현동'),
  address_road  = REPLACE(address_road, '인천 연수구', '인천 남동구'),
  address_sido  = '인천',
  address_gugun = '남동구',
  address_dong  = '논현동'
WHERE (address LIKE '%인천%연수구%논현%' OR address_road LIKE '%인천%연수구%논현%')
   OR (address_sido = '인천' AND address_gugun = '연수구' AND address_dong = '논현동');
