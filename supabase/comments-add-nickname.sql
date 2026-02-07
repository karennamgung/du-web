-- 기존 comments 테이블에 nickname 컬럼 추가 (Supabase SQL Editor에서 실행)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS nickname text;
