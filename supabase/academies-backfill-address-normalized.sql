-- 기존 academies 행의 address/address_road에서 정규화 컬럼 백필 (address.ts 포맷)
-- 1) academies-add-address-normalized.sql 실행 후 실행

-- 인천 연수구 송도·송도2동 등 → 인천, 연수구, 송도동
UPDATE public.academies
SET address_sido = '인천', address_gugun = '연수구', address_dong = '송도동'
WHERE (address LIKE '%인천%' AND address LIKE '%연수구%' AND (address LIKE '%송도%' OR address_road LIKE '%송도%'))
   OR (address_road LIKE '%인천%' AND address_road LIKE '%연수구%' AND address_road LIKE '%송도%');

-- 인천 남동구 논현동 (논현동은 남동구 소속, 연수구 아님)
UPDATE public.academies
SET address_sido = '인천', address_gugun = '남동구', address_dong = '논현동'
WHERE (address LIKE '%인천%' AND address LIKE '%논현%')
   OR (address_road LIKE '%인천%' AND address_road LIKE '%논현%');

-- 인천 연수구 기타 (동 없으면 구만) — 이미 위에서 송도/논현 처리된 행은 제외
UPDATE public.academies
SET address_sido = '인천', address_gugun = '연수구', address_dong = NULL
WHERE ((address LIKE '%인천%' AND address LIKE '%연수구%')
   OR (address_road LIKE '%인천%' AND address_road LIKE '%연수구%'))
  AND address_sido IS NULL;

-- 서울 강남구 (예시: 역삼동, 논현동, 삼성동 등)
UPDATE public.academies
SET address_sido = '서울', address_gugun = '강남구', address_dong = '역삼동'
WHERE (address LIKE '%서울%' AND address LIKE '%강남%' AND address LIKE '%역삼%')
   OR (address_road LIKE '%서울%' AND address_road LIKE '%강남%' AND address_road LIKE '%역삼%');

UPDATE public.academies
SET address_sido = '서울', address_gugun = '강남구', address_dong = '논현동'
WHERE (address LIKE '%서울%' AND address LIKE '%강남%' AND address LIKE '%논현%')
   OR (address_road LIKE '%서울%' AND address_road LIKE '%강남%' AND address_road LIKE '%논현%');

UPDATE public.academies
SET address_sido = '서울', address_gugun = '강남구', address_dong = '삼성동'
WHERE (address LIKE '%서울%' AND address LIKE '%강남%' AND address LIKE '%삼성%')
   OR (address_road LIKE '%서울%' AND address_road LIKE '%강남%' AND address_road LIKE '%삼성%');

UPDATE public.academies
SET address_sido = '서울', address_gugun = '강남구', address_dong = NULL
WHERE ((address LIKE '%서울%' AND address LIKE '%강남%')
   OR (address_road LIKE '%서울%' AND address_road LIKE '%강남%'))
  AND address_sido IS NULL;
