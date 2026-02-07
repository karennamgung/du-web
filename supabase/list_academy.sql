-- 학원 시드 목록 (송도 + 논현동). address = 지번, address_road = 도로명 (두 컬럼).
-- 1) academies-add-address-road.sql 로 address_road 컬럼 추가 후 실행
-- 2) 기존 행이 있으면 아래 UPDATE로 주소 적용
-- 3) 테이블이 비어 있거나 해당 지역이 없을 때만 INSERT로 새로 넣음

-- [기존 데이터에 주소 적용] 학원명으로 매칭해서 address(지번), address_road(도로명) UPDATE
UPDATE public.academies SET address = '인천 연수구 송도2동 123-1', address_road = '인천 연수구 송도대로 123' WHERE name = '송도영어학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 45-2', address_road = '인천 연수구 컨벤시아대로 45' WHERE name = '글로벌수학학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 78-3', address_road = '인천 연수구 송바이오대로 78' WHERE name = '송도코딩센터';
UPDATE public.academies SET address = '인천 연수구 송도2동 101-4', address_road = '인천 연수구 인천타워대로 101' WHERE name = '예림국어학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 22-5', address_road = '인천 연수구 송도과학로 22' WHERE name = '송도피아노학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 56-6', address_road = '인천 연수구 아트센터대로 56' WHERE name = '다담미술학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 33-7', address_road = '인천 연수구 스포츠로 33' WHERE name = '송도체육관';
UPDATE public.academies SET address = '인천 연수구 송도2동 88-8', address_road = '인천 연수구 컨벤시아대로 88' WHERE name = '해법국어영어';
UPDATE public.academies SET address = '인천 연수구 송도2동 11-9', address_road = '인천 연수구 송도교육로 11' WHERE name = '송도논술학원';
UPDATE public.academies SET address = '인천 연수구 송도2동 200-10', address_road = '인천 연수구 송도대로 200' WHERE name = '키즈발레학원';
UPDATE public.academies SET address = '인천 연수구 논현동 50', address_road = '인천 연수구 논현로 50' WHERE name = '논현영어학원';
UPDATE public.academies SET address = '인천 연수구 논현동 112', address_road = '인천 연수구 청능대로 112' WHERE name = '논현수학학원';
UPDATE public.academies SET address = '인천 연수구 논현동 98', address_road = '인천 연수구 청능대로 98' WHERE name = '논현코딩센터';
UPDATE public.academies SET address = '인천 연수구 논현동 88', address_road = '인천 연수구 논현로 88' WHERE name = '논현국어학원';
UPDATE public.academies SET address = '인천 연수구 논현동 75', address_road = '인천 연수구 청능대로 75' WHERE name = '논현피아노학원';
UPDATE public.academies SET address = '인천 연수구 논현동 120', address_road = '인천 연수구 논현로 120' WHERE name = '논현미술학원';
UPDATE public.academies SET address = '인천 연수구 논현동 130', address_road = '인천 연수구 청능대로 130' WHERE name = '논현체육관';
UPDATE public.academies SET address = '인천 연수구 논현동 65', address_road = '인천 연수구 논현로 65' WHERE name = '논현국영수';
UPDATE public.academies SET address = '인천 연수구 논현동 90', address_road = '인천 연수구 청능대로 90' WHERE name = '논현논술학원';
UPDATE public.academies SET address = '인천 연수구 논현동 95', address_road = '인천 연수구 논현로 95' WHERE name = '논현발레학원';

-- 송도 (인천 연수구 송도2동)
INSERT INTO public.academies (name, address, address_road, lat, lng, subjects, age_group, image_url)
SELECT * FROM (VALUES
  ('송도영어학원', '인천 연수구 송도2동 123-1', '인천 연수구 송도대로 123', 37.3820, 126.6520, ARRAY['영어','수학'], ARRAY['초등','중등'], 'https://picsum.photos/seed/songdo1/800/400'),
  ('글로벌수학학원', '인천 연수구 송도2동 45-2', '인천 연수구 컨벤시아대로 45', 37.3860, 126.6580, ARRAY['수학','과학'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/songdo2/800/400'),
  ('송도코딩센터', '인천 연수구 송도2동 78-3', '인천 연수구 송바이오대로 78', 37.3800, 126.6620, ARRAY['코딩','로봇'], ARRAY['초등','중등'], 'https://picsum.photos/seed/songdo3/800/400'),
  ('예림국어학원', '인천 연수구 송도2동 101-4', '인천 연수구 인천타워대로 101', 37.3880, 126.6540, ARRAY['국어','논술'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/songdo4/800/400'),
  ('송도피아노학원', '인천 연수구 송도2동 22-5', '인천 연수구 송도과학로 22', 37.3840, 126.6600, ARRAY['피아노','음악이론'], ARRAY['유치','초등'], 'https://picsum.photos/seed/songdo5/800/400'),
  ('다담미술학원', '인천 연수구 송도2동 56-6', '인천 연수구 아트센터대로 56', 37.3780, 126.6560, ARRAY['미술','디자인'], ARRAY['유치','초등','중등'], 'https://picsum.photos/seed/songdo6/800/400'),
  ('송도체육관', '인천 연수구 송도2동 33-7', '인천 연수구 스포츠로 33', 37.3900, 126.6620, ARRAY['축구','농구','수영'], ARRAY['초등','중등'], 'https://picsum.photos/seed/songdo7/800/400'),
  ('해법국어영어', '인천 연수구 송도2동 88-8', '인천 연수구 컨벤시아대로 88', 37.3810, 126.6480, ARRAY['국어','영어'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/songdo8/800/400'),
  ('송도논술학원', '인천 연수구 송도2동 11-9', '인천 연수구 송도교육로 11', 37.3850, 126.6500, ARRAY['논술','국어','영어'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/songdo9/800/400'),
  ('키즈발레학원', '인천 연수구 송도2동 200-10', '인천 연수구 송도대로 200', 37.3790, 126.6640, ARRAY['발레','현대무용'], ARRAY['유치','초등'], 'https://picsum.photos/seed/songdo10/800/400')
) AS v(name, address, address_road, lat, lng, subjects, age_group, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.academies WHERE address LIKE '%송도2동%' LIMIT 1);

-- 논현동 (인천 연수구 논현동)
INSERT INTO public.academies (name, address, address_road, lat, lng, subjects, age_group, image_url)
SELECT * FROM (VALUES
  ('논현영어학원', '인천 연수구 논현동 50', '인천 연수구 논현로 50', 37.4080, 126.7080, ARRAY['영어','수학'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon1/800/400'),
  ('논현수학학원', '인천 연수구 논현동 112', '인천 연수구 청능대로 112', 37.4100, 126.7120, ARRAY['수학','과학'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon2/800/400'),
  ('논현코딩센터', '인천 연수구 논현동 98', '인천 연수구 청능대로 98', 37.4060, 126.7100, ARRAY['코딩','로봇'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon3/800/400'),
  ('논현국어학원', '인천 연수구 논현동 88', '인천 연수구 논현로 88', 37.4120, 126.7060, ARRAY['국어','논술'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon4/800/400'),
  ('논현피아노학원', '인천 연수구 논현동 75', '인천 연수구 청능대로 75', 37.4040, 126.7140, ARRAY['피아노','음악이론'], ARRAY['유치','초등'], 'https://picsum.photos/seed/nonhyeon5/800/400'),
  ('논현미술학원', '인천 연수구 논현동 120', '인천 연수구 논현로 120', 37.4140, 126.7040, ARRAY['미술','디자인'], ARRAY['유치','초등','중등'], 'https://picsum.photos/seed/nonhyeon6/800/400'),
  ('논현체육관', '인천 연수구 논현동 130', '인천 연수구 청능대로 130', 37.4160, 126.7160, ARRAY['축구','농구','수영'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon7/800/400'),
  ('논현국영수', '인천 연수구 논현동 65', '인천 연수구 논현로 65', 37.4090, 126.7020, ARRAY['국어','영어','수학'], ARRAY['중등','고등'], 'https://picsum.photos/seed/nonhyeon8/800/400'),
  ('논현논술학원', '인천 연수구 논현동 90', '인천 연수구 청능대로 90', 37.4070, 126.7110, ARRAY['논술','국어','영어'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon9/800/400'),
  ('논현발레학원', '인천 연수구 논현동 95', '인천 연수구 논현로 95', 37.4110, 126.7090, ARRAY['발레','현대무용'], ARRAY['유치','초등'], 'https://picsum.photos/seed/nonhyeon10/800/400')
) AS v(name, address, address_road, lat, lng, subjects, age_group, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.academies WHERE address LIKE '%논현동%' LIMIT 1);
