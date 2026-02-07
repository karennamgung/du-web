-- academies 테이블 (학원 사진 image_url 포함)
CREATE TABLE IF NOT EXISTS public.academies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  subjects text[] NOT NULL DEFAULT '{}',
  age_group text[] DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text
);

-- RLS
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "academies_public_read" ON public.academies;
CREATE POLICY "academies_public_read"
  ON public.academies FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "academies_authenticated_read" ON public.academies;
CREATE POLICY "academies_authenticated_read"
  ON public.academies FOR SELECT TO authenticated
  USING (true);

-- 시드 (이미 데이터가 있으면 건너뛰기)
INSERT INTO public.academies (name, address, lat, lng, subjects, image_url)
SELECT * FROM (VALUES
  ('송도영어학원', '인천 연수구 송도대로 123', 37.3820, 126.6520, ARRAY['영어','수학'], 'https://picsum.photos/seed/songdo1/800/400'),
  ('글로벌수학학원', '인천 연수구 컨벤시아대로 45', 37.3860, 126.6580, ARRAY['수학','과학'], 'https://picsum.photos/seed/songdo2/800/400'),
  ('송도코딩센터', '인천 연수구 송바이오대로 78', 37.3800, 126.6620, ARRAY['코딩','로봇'], 'https://picsum.photos/seed/songdo3/800/400'),
  ('예림국어학원', '인천 연수구 인천타워대로 101', 37.3880, 126.6540, ARRAY['국어','논술'], 'https://picsum.photos/seed/songdo4/800/400'),
  ('송도피아노학원', '인천 연수구 송도과학로 22', 37.3840, 126.6600, ARRAY['피아노','음악이론'], 'https://picsum.photos/seed/songdo5/800/400'),
  ('다담미술학원', '인천 연수구 아트센터대로 56', 37.3780, 126.6560, ARRAY['미술','디자인'], 'https://picsum.photos/seed/songdo6/800/400'),
  ('송도체육관', '인천 연수구 스포츠로 33', 37.3900, 126.6620, ARRAY['축구','농구','수영'], 'https://picsum.photos/seed/songdo7/800/400'),
  ('해법국어영어', '인천 연수구 컨벤시아대로 88', 37.3810, 126.6480, ARRAY['국어','영어'], 'https://picsum.photos/seed/songdo8/800/400'),
  ('송도논술학원', '인천 연수구 송도교육로 11', 37.3850, 126.6500, ARRAY['논술','국어','영어'], 'https://picsum.photos/seed/songdo9/800/400'),
  ('키즈발레학원', '인천 연수구 송도대로 200', 37.3790, 126.6640, ARRAY['발레','현대무용'], 'https://picsum.photos/seed/songdo10/800/400')
) AS v(name, address, lat, lng, subjects, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.academies LIMIT 1);
