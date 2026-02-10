-- =============================================================================
-- profiles / children 데이터 확인용 (Supabase SQL Editor에서 실행)
-- =============================================================================

-- 1. profiles 테이블: 프로필 수, 자녀 있는 프로필 수
SELECT
  COUNT(*) AS "전체 프로필 수",
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(children, '[]'::jsonb)) > 0) AS "자녀 있는 프로필 수"
FROM public.profiles;

-- 2. 자녀가 있는 프로필 목록 (user_id, 자녀 수, children JSON)
SELECT
  id,
  user_id,
  user_type,
  nickname,
  jsonb_array_length(COALESCE(children, '[]'::jsonb)) AS child_count,
  children
FROM public.profiles
WHERE children IS NOT NULL AND jsonb_array_length(children) > 0
ORDER BY updated_at DESC;

-- 3. children 배열 안 각 아이 필드 확인 (education_institution 남아 있으면 여기서 보임)
SELECT
  p.user_id,
  p.nickname,
  child->>'name' AS name,
  child->>'age' AS age,
  child->>'birth_year' AS birth_year,
  child->>'education_institution' AS education_institution,
  child->>'gender' AS gender
FROM public.profiles p,
  jsonb_array_elements(COALESCE(p.children, '[]'::jsonb)) AS child
WHERE jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) > 0;

-- 4. public.children 테이블 존재 시 컬럼 목록
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'children'
ORDER BY ordinal_position;
