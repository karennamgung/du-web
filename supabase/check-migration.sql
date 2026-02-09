-- =============================================================================
-- 마이그레이션 전 상태 확인 및 문제 진단
-- =============================================================================

-- 1. children 테이블 데이터 확인
SELECT 
  'children 테이블' AS "테이블명",
  COUNT(*) AS "레코드 수",
  COUNT(DISTINCT parent_id) AS "고유 부모 수"
FROM public.children;

-- 2. children 테이블의 parent_id 샘플 확인
SELECT 
  parent_id,
  COUNT(*) AS "아이 수",
  array_agg(name ORDER BY "order") AS "아이 이름들"
FROM public.children
GROUP BY parent_id
LIMIT 5;

-- 3. profiles 테이블 확인
SELECT 
  'profiles 테이블' AS "테이블명",
  COUNT(*) AS "레코드 수",
  COUNT(*) FILTER (WHERE user_type = 'parent') AS "학부모 수"
FROM public.profiles;

-- 4. 매칭 확인 (parent_id가 profiles.user_id와 일치하는지)
SELECT 
  '매칭 확인' AS "확인 항목",
  COUNT(DISTINCT c.parent_id) AS "children의 고유 parent_id 수",
  COUNT(DISTINCT p.user_id) AS "profiles의 고유 user_id 수",
  COUNT(DISTINCT c.parent_id) FILTER (
    WHERE EXISTS (SELECT 1 FROM public.profiles p2 WHERE p2.user_id = c.parent_id)
  ) AS "매칭되는 parent_id 수"
FROM public.children c
CROSS JOIN public.profiles p;

-- 5. 매칭되지 않는 children 레코드 확인
SELECT 
  c.parent_id,
  c.name,
  c.birth_year,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = c.parent_id)
    THEN '✅ 매칭됨'
    ELSE '❌ 매칭 안됨 - 프로필 없음'
  END AS "상태"
FROM public.children c
LIMIT 10;

-- 6. profiles.children 현재 상태 확인
SELECT 
  p.user_id,
  p.nickname,
  p.user_type,
  jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) AS "현재 children 수",
  p.children
FROM public.profiles p
WHERE p.user_type = 'parent'
LIMIT 5;
