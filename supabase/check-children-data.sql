-- =============================================================================
-- children JSON 데이터 확인 쿼리
-- =============================================================================

-- 1. 특정 사용자(김예원)의 children 데이터 확인
SELECT 
  p.nickname AS "별명",
  p.user_type AS "유형",
  p.children AS "아이 정보 (전체 JSON)",
  jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) AS "아이 수"
FROM public.profiles p
WHERE p.nickname LIKE '%예원%' OR p.nickname LIKE '%김예원%'
ORDER BY p.created_at DESC;

-- 2. 모든 학부모의 children 데이터 확인
SELECT 
  p.nickname AS "별명",
  p.user_type AS "유형",
  jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) AS "아이 수",
  p.children AS "아이 정보"
FROM public.profiles p
WHERE p.user_type = 'parent'
ORDER BY p.created_at DESC;

-- 3. children JSON 구조 상세 확인 (각 아이별로 펼쳐서 보기)
SELECT 
  p.nickname AS "부모 별명",
  p.user_type AS "유형",
  jsonb_array_elements(p.children) AS "아이 정보 (개별)"
FROM public.profiles p
WHERE p.user_type = 'parent'
  AND jsonb_array_length(COALESCE(p.children, '[]'::jsonb)) > 0
ORDER BY p.created_at DESC;

-- 4. children JSON 필드별 상세 확인
SELECT 
  p.nickname AS "부모 별명",
  child->>'name' AS "아이 이름",
  (child->>'birth_year')::integer AS "출생년도",
  child->>'education_institution' AS "교육기관",
  child->>'gender' AS "성별"
FROM public.profiles p,
  jsonb_array_elements(COALESCE(p.children, '[]'::jsonb)) AS child
WHERE p.user_type = 'parent'
ORDER BY p.created_at DESC, child->>'name';

-- 5. 데이터 무결성 확인 (필수 필드 체크)
SELECT 
  p.nickname AS "부모 별명",
  child->>'name' AS "아이 이름",
  CASE 
    WHEN child->>'name' IS NULL OR child->>'name' = '' THEN '❌ 이름 없음'
    ELSE '✅'
  END AS "이름 체크",
  CASE 
    WHEN child->>'birth_year' IS NULL THEN '❌ 출생년도 없음'
    ELSE '✅'
  END AS "출생년도 체크",
  child->>'education_institution' AS "교육기관",
  child->>'gender' AS "성별"
FROM public.profiles p,
  jsonb_array_elements(COALESCE(p.children, '[]'::jsonb)) AS child
WHERE p.user_type = 'parent'
ORDER BY p.created_at DESC;

-- 6. children 테이블과 비교 (마이그레이션 검증)
SELECT 
  'children 테이블' AS "소스",
  COUNT(*) AS "레코드 수"
FROM public.children
UNION ALL
SELECT 
  'profiles.children JSON' AS "소스",
  SUM(jsonb_array_length(COALESCE(children, '[]'::jsonb))) AS "레코드 수"
FROM public.profiles
WHERE user_type = 'parent';
