-- =============================================================================
-- children 테이블 데이터를 profiles.children JSON 필드로 마이그레이션
-- =============================================================================
-- 
-- 이 SQL은 기존 children 테이블의 데이터를 profiles.children JSON 필드로 이동합니다.
-- 실행 전에 children 테이블이 존재하고 데이터가 있는지 확인하세요.
-- =============================================================================

-- 1. 현재 상태 확인
DO $$
DECLARE
  children_count INTEGER;
  profiles_count INTEGER;
BEGIN
  -- children 테이블 데이터 수 확인
  SELECT COUNT(*) INTO children_count FROM public.children;
  
  -- 프로필이 있는 사용자 수 확인
  SELECT COUNT(*) INTO profiles_count FROM public.profiles;
  
  RAISE NOTICE '현재 상태:';
  RAISE NOTICE '  - children 테이블 레코드 수: %', children_count;
  RAISE NOTICE '  - profiles 테이블 레코드 수: %', profiles_count;
END $$;

-- 2. profiles 테이블에 children 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 3. 기존 children 테이블 데이터를 profiles.children으로 마이그레이션
-- parent_id가 auth.users.id를 참조하므로, profiles.user_id와 매칭
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
  WHERE c.parent_id = p.user_id  -- user_id와 매칭 (parent_id는 auth.users.id를 참조)
)
WHERE EXISTS (
  SELECT 1 FROM public.children c WHERE c.parent_id = p.user_id
);

-- 4. 마이그레이션 결과 확인
DO $$
DECLARE
  migrated_count INTEGER;
  total_children INTEGER;
BEGIN
  -- 마이그레이션된 프로필 수 확인
  SELECT COUNT(*) INTO migrated_count
  FROM public.profiles
  WHERE jsonb_array_length(children) > 0;
  
  -- 전체 아이 수 확인
  SELECT COUNT(*) INTO total_children FROM public.children;
  
  RAISE NOTICE '마이그레이션 결과:';
  RAISE NOTICE '  - 아이 정보가 저장된 프로필 수: %', migrated_count;
  RAISE NOTICE '  - children 테이블의 총 레코드 수: %', total_children;
  
  -- 데이터 일치 확인
  IF migrated_count > 0 THEN
    RAISE NOTICE '✅ 마이그레이션 완료!';
    RAISE NOTICE '⚠️  데이터 확인 후 children 테이블을 삭제할 수 있습니다.';
  ELSE
    RAISE WARNING '⚠️  마이그레이션된 데이터가 없습니다. parent_id와 profiles.id가 일치하는지 확인하세요.';
  END IF;
END $$;

-- 5. 데이터 확인 쿼리 (실행 후 확인용)
-- 아래 쿼리를 실행하여 마이그레이션 결과를 확인하세요:
/*
SELECT 
  p.nickname,
  p.user_type,
  jsonb_array_length(p.children) as children_count,
  p.children
FROM public.profiles p
WHERE jsonb_array_length(p.children) > 0
ORDER BY p.created_at DESC;
*/

-- 6. children 테이블 삭제 (선택사항 - 데이터 확인 후에만 실행!)
-- 주의: 이 단계는 위의 확인 쿼리로 데이터가 제대로 마이그레이션되었는지 확인한 후에만 실행하세요!
/*
DROP TABLE IF EXISTS public.children CASCADE;
*/
