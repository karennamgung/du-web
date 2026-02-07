-- 기존 comments 테이블에 tag_keys 컬럼 추가 (경험 태그를 리뷰과 함께 저장)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS tag_keys text[] DEFAULT '{}';
