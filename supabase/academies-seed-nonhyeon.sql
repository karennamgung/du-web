-- 연수구 논현동 주소 학원 시드 (기존 송도 시드와 별도로 추가)
-- 논현동 대략 좌표: 송도 북쪽 인근 (37.41~37.42, 126.70~126.72)
INSERT INTO public.academies (name, address, lat, lng, subjects, age_group, image_url)
SELECT * FROM (VALUES
  ('논현영어학원', '인천 연수구 논현동 논현로 50', 37.4080, 126.7080, ARRAY['영어','수학'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon1/800/400'),
  ('논현수학학원', '인천 연수구 논현동 청능대로 112', 37.4100, 126.7120, ARRAY['수학','과학'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon2/800/400'),
  ('논현코딩센터', '인천 연수구 논현동 청능대로 98', 37.4060, 126.7100, ARRAY['코딩','로봇'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon3/800/400'),
  ('논현국어학원', '인천 연수구 논현동 논현로 88', 37.4120, 126.7060, ARRAY['국어','논술'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon4/800/400'),
  ('논현피아노학원', '인천 연수구 논현동 청능대로 75', 37.4040, 126.7140, ARRAY['피아노','음악이론'], ARRAY['유치','초등'], 'https://picsum.photos/seed/nonhyeon5/800/400'),
  ('논현미술학원', '인천 연수구 논현동 논현로 120', 37.4140, 126.7040, ARRAY['미술','디자인'], ARRAY['유치','초등','중등'], 'https://picsum.photos/seed/nonhyeon6/800/400'),
  ('논현체육관', '인천 연수구 논현동 청능대로 130', 37.4160, 126.7160, ARRAY['축구','농구','수영'], ARRAY['초등','중등'], 'https://picsum.photos/seed/nonhyeon7/800/400'),
  ('논현국영수', '인천 연수구 논현동 논현로 65', 37.4090, 126.7020, ARRAY['국어','영어','수학'], ARRAY['중등','고등'], 'https://picsum.photos/seed/nonhyeon8/800/400'),
  ('논현논술학원', '인천 연수구 논현동 청능대로 90', 37.4070, 126.7110, ARRAY['논술','국어','영어'], ARRAY['초등','중등','고등'], 'https://picsum.photos/seed/nonhyeon9/800/400'),
  ('논현발레학원', '인천 연수구 논현동 논현로 95', 37.4110, 126.7090, ARRAY['발레','현대무용'], ARRAY['유치','초등'], 'https://picsum.photos/seed/nonhyeon10/800/400')
) AS v(name, address, lat, lng, subjects, age_group, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.academies WHERE address LIKE '%논현동%' LIMIT 1);
