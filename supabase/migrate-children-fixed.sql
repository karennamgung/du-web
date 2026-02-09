-- =============================================================================
-- children 데이터 마이그레이션 (타입 에러 수정 버전)
-- =============================================================================
-- 
-- 이 SQL은 타입 에러를 수정한 버전입니다.
-- json_agg는 json 타입을 반환하므로 jsonb로 캐스팅합니다.
-- =============================================================================

-- 1. profiles 테이블에 children 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 2. JSONB 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_children 
ON public.profiles USING GIN (children);

-- 3. 범용 마이그레이션 (user_id 또는 id로 매칭)
-- json_agg 결과를 jsonb로 캐스팅하여 타입 일치
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

-- 4. 결과 확인
DO $$
DECLARE
  children_table_count INTEGER;
  migrated_profiles_count INTEGER;
  total_migrated_children INTEGER;
BEGIN
  SELECT COUNT(*) INTO children_table_count FROM public.children;
  
  SELECT COUNT(*) INTO migrated_profiles_count
  FROM public.profiles
  WHERE jsonb_array_length(COALESCE(children, '[]'::jsonb)) > 0;
  
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
  END IF;
END $$;
