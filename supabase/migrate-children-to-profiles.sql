-- =============================================================================
-- children 테이블의 parent_id를 auth.users에서 profiles로 변경하는 마이그레이션
-- =============================================================================
-- 
-- 이 마이그레이션은 기존에 children 테이블이 auth.users를 참조하고 있는 경우
-- profiles 테이블을 참조하도록 변경합니다.
--
-- 실행 전 주의사항:
-- 1. 기존 데이터가 있는 경우 백업을 권장합니다
-- 2. profiles 테이블이 이미 생성되어 있어야 합니다
-- 3. 모든 사용자가 프로필을 가지고 있어야 합니다 (없으면 에러 발생)
-- =============================================================================

-- 1. 기존 외래 키 제약조건 삭제
ALTER TABLE IF EXISTS public.children
  DROP CONSTRAINT IF EXISTS children_parent_id_fkey;

-- 2. 기존 RLS 정책 삭제 (나중에 다시 생성)
DROP POLICY IF EXISTS "Parents can read own children" ON public.children;
DROP POLICY IF EXISTS "Parents can insert own children" ON public.children;
DROP POLICY IF EXISTS "Parents can update own children" ON public.children;
DROP POLICY IF EXISTS "Parents can delete own children" ON public.children;

-- 3. 데이터 무결성 확인
-- parent_id가 profiles.id에 존재하는지 확인 (없으면 에러)
DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM public.children c
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = c.parent_id
  );
  
  IF orphan_count > 0 THEN
    RAISE EXCEPTION '데이터 무결성 오류: %개의 아이 레코드가 프로필을 찾을 수 없습니다. 먼저 프로필을 생성해주세요.', orphan_count;
  END IF;
END $$;

-- 4. 새로운 외래 키 제약조건 추가 (profiles.id 참조)
ALTER TABLE public.children
  ADD CONSTRAINT children_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- 5. RLS 정책 재생성 (profiles를 통해 인증 확인)
CREATE POLICY "Parents can read own children" ON public.children
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = children.parent_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can insert own children" ON public.children
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = children.parent_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can update own children" ON public.children
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = children.parent_id 
      AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Parents can delete own children" ON public.children
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = children.parent_id 
      AND profiles.user_id = auth.uid()
    )
  );

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '마이그레이션 완료: children.parent_id가 profiles.id를 참조하도록 변경되었습니다.';
END $$;
