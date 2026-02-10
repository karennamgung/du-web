-- =============================================================================
-- education_institution 제거: profiles.children JSONB + children 테이블
-- =============================================================================
-- 앱에서 교육기관 필드를 제거했으므로:
-- 1. profiles.children JSONB 배열의 각 객체에서 education_institution 키 제거
-- 2. public.children 테이블이 있으면 education_institution 컬럼 제거
-- =============================================================================

-- 1. 적용 대상 확인 (실행 전 참고용)
-- SELECT id, user_id, jsonb_array_length(COALESCE(children, '[]'::jsonb)) AS child_count, children
-- FROM public.profiles
-- WHERE children IS NOT NULL AND jsonb_array_length(children) > 0;

-- 2. children 배열의 각 요소에서 education_institution 키 제거
UPDATE public.profiles p
SET children = (
  SELECT COALESCE(
    jsonb_agg(elem - 'education_institution'),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(p.children, '[]'::jsonb)) AS elem
)
WHERE p.children IS NOT NULL;

-- 3. public.children 테이블에서 education_institution 컬럼 제거 (테이블이 있을 때만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'children'
  ) THEN
    ALTER TABLE public.children DROP COLUMN IF EXISTS education_institution;
    RAISE NOTICE 'public.children 테이블에서 education_institution 컬럼을 제거했습니다.';
  END IF;
END $$;

-- 4. 적용 결과 확인 (실행 후 참고용)
-- SELECT id, user_id, jsonb_array_length(COALESCE(children, '[]'::jsonb)) AS child_count, children
-- FROM public.profiles
-- WHERE children IS NOT NULL AND jsonb_array_length(children) > 0;
