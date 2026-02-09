-- =============================================================================
-- 범용 children 데이터 마이그레이션 (모든 경우 처리)
-- =============================================================================
-- 
-- 이 SQL은 parent_id가 user_id를 참조하든 id를 참조하든 모두 처리합니다.
-- 안전하게 여러 번 실행해도 됩니다.
-- =============================================================================

-- 1. profiles 테이블에 children 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 2. JSONB 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_children 
ON public.profiles USING GIN (children);

-- 3. 범용 마이그레이션 (user_id 또는 id로 매칭)
UPDATE public.profiles p
SET children = (
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'name', c.name,
        'birth_year', c.birth_year,
        'education_institution', c.education_institution,
        'gender', c.gender
      ) ORDER BY COALESCE(c."order", 999) NULLS LAST
    )::jsonb,
    '[]'::jsonb
  )
  FROM public.children c
  WHERE c.parent_id = p.user_id OR c.parent_id = p.id
)
WHERE EXISTS (
  SELECT 1 FROM public.children c 
  WHERE c.parent_id = p.user_id OR c.parent_id = p.id
);

-- 4. 결과 확인 및 리포트
DO $$
DECLARE
  children_table_count INTEGER;
  migrated_profiles_count INTEGER;
  total_migrated_children INTEGER;
BEGIN
  -- children 테이블 레코드 수
  SELECT COUNT(*) INTO children_table_count FROM public.children;
  
  -- 마이그레이션된 프로필 수
  SELECT COUNT(*) INTO migrated_profiles_count
  FROM public.profiles
  WHERE jsonb_array_length(COALESCE(children, '[]'::jsonb)) > 0;
  
  -- 마이그레이션된 총 아이 수
  SELECT SUM(jsonb_array_length(COALESCE(children, '[]'::jsonb))) 
  INTO total_migrated_children
  FROM public.profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '마이그레이션 결과:';
  RAISE NOTICE '  - children 테이블 레코드 수: %', children_table_count;
  RAISE NOTICE '  - 마이그레이션된 프로필 수: %', migrated_profiles_count;
  RAISE NOTICE '  - 마이그레이션된 총 아이 수: %', total_migrated_children;
  RAISE NOTICE '========================================';
  
  IF migrated_profiles_count > 0 THEN
    RAISE NOTICE '✅ 마이그레이션 성공!';
  ELSE
    RAISE WARNING '⚠️  마이그레이션된 데이터가 없습니다.';
    RAISE NOTICE '아래 쿼리로 매칭 상태를 확인하세요:';
    RAISE NOTICE 'SELECT c.parent_id, p.user_id, p.id FROM public.children c LEFT JOIN public.profiles p ON c.parent_id = p.user_id OR c.parent_id = p.id LIMIT 10;';
  END IF;
END $$;

-- 5. 마이그레이션 결과 상세 확인 (주석 해제하여 실행)
/*
SELECT 
  p.nickname,
  p.user_type,
  jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) AS "children_count",
  p.children
FROM public.profiles p
WHERE jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) > 0
ORDER BY p.created_at DESC;
*/
