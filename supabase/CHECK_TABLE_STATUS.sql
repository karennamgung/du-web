-- =============================================================================
-- 테이블 상태 확인 쿼리
-- Supabase SQL Editor에서 실행하여 현재 테이블 구조를 확인할 수 있습니다
-- =============================================================================

-- 1. children 테이블의 외래 키 제약조건 확인
-- parent_id가 어떤 테이블을 참조하는지 확인
SELECT 
  tc.constraint_name AS "제약조건 이름",
  tc.table_name AS "테이블명",
  kcu.column_name AS "컬럼명",
  ccu.table_name AS "참조 테이블",
  ccu.column_name AS "참조 컬럼",
  rc.delete_rule AS "삭제 규칙"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'children' 
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. profiles 테이블 구조 확인
SELECT 
  column_name AS "컬럼명",
  data_type AS "데이터 타입",
  is_nullable AS "NULL 허용",
  column_default AS "기본값"
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. children 테이블 구조 확인
SELECT 
  column_name AS "컬럼명",
  data_type AS "데이터 타입",
  is_nullable AS "NULL 허용",
  column_default AS "기본값"
FROM information_schema.columns
WHERE table_name = 'children'
ORDER BY ordinal_position;

-- 4. RLS 정책 확인
SELECT 
  schemaname AS "스키마",
  tablename AS "테이블명",
  policyname AS "정책명",
  permissive AS "허용",
  roles AS "역할",
  cmd AS "명령",
  qual AS "조건",
  with_check AS "체크 조건"
FROM pg_policies
WHERE tablename IN ('profiles', 'children')
ORDER BY tablename, policyname;

-- 5. 데이터 무결성 확인
-- 프로필 없이 아이가 등록된 경우 확인
SELECT 
  COUNT(*) AS "프로필 없는 아이 수",
  COUNT(DISTINCT parent_id) AS "프로필 없는 부모 수"
FROM public.children c
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = c.parent_id
);

-- 6. 현재 데이터 상태 요약
SELECT 
  'profiles' AS "테이블명",
  COUNT(*) AS "레코드 수"
FROM public.profiles
UNION ALL
SELECT 
  'children' AS "테이블명",
  COUNT(*) AS "레코드 수"
FROM public.children;
