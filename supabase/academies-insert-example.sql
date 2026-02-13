-- 새 학원 INSERT 시 주소 컬럼 채우는 예시
-- address.ts (시/도·구·동)와 문자열을 동일하게 맞출 것

-- 예: 인천 연수구 송도동
INSERT INTO public.academies (
  name, address, address_road,
  address_sido, address_gugun, address_dong,
  lat, lng, subjects, age_group, image_url
) VALUES (
  '새학원이름',
  '인천 연수구 송도2동 123-1',
  '인천 연수구 송도대로 123',
  '인천', '연수구', '송도동',
  37.3820, 126.6520,
  ARRAY['영어','수학'],
  ARRAY['초등','중등'],
  NULL
);

-- 예: 인천 남동구 논현동
-- INSERT INTO public.academies (
--   name, address, address_road,
--   address_sido, address_gugun, address_dong,
--   lat, lng, subjects, age_group, image_url
-- ) VALUES (
--   '논현학원',
--   '인천 남동구 논현동 50',
--   '인천 남동구 논현로 50',
--   '인천', '남동구', '논현동',
--   37.xxxx, 126.xxxx,
--   ARRAY['영어'],
--   ARRAY['초등'],
--   NULL
-- );

-- 예: 구만 있고 동은 NULL (해당 구 전체)
-- INSERT INTO public.academies (
--   name, address, address_road,
--   address_sido, address_gugun, address_dong,
--   ...
-- ) VALUES (
--   '학원이름',
--   '서울 강남구 역삼동 123',
--   '서울 강남구 테헤란로 123',
--   '서울', '강남구', NULL,
--   ...
-- );
