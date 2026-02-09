-- =============================================================================
-- children 테이블을 제거하고 profiles.children JSON 필드로 마이그레이션
-- =============================================================================
-- 
-- 이 마이그레이션은 기존 children 테이블의 데이터를 profiles.children JSON 필드로 이동합니다.
--
-- 실행 전 주의사항:
-- 1. 기존 데이터가 있는 경우 백업을 권장합니다
-- 2. profiles 테이블이 이미 생성되어 있어야 합니다
-- =============================================================================

-- 1. profiles 테이블에 children JSONB 컬럼 추가 (없는 경우)
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb;

-- 2. 기존 children 테이블 데이터를 profiles.children으로 마이그레이션
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

-- 3. children 테이블 삭제 (선택사항 - 데이터 확인 후)
-- 주의: 이 단계는 데이터가 제대로 마이그레이션되었는지 확인한 후에만 실행하세요!
-- DROP TABLE IF EXISTS public.children CASCADE;

-- 완료 메시지
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count
  FROM public.profiles
  WHERE jsonb_array_length(children) > 0;
  
  RAISE NOTICE '마이그레이션 완료: %명의 프로필에 아이 정보가 저장되었습니다.', migrated_count;
END $$;
