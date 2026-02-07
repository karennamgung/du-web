-- 기존 academies 테이블에 image_url 컬럼만 추가할 때 (Supabase SQL Editor에서 실행)
ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS image_url text;
