-- =============================================================================
-- profiles.children: birth_year → age 로 변경
-- =============================================================================
-- 앱에서 나이(age)를 저장하도록 변경했으므로, 기존에 birth_year로 저장된
-- children JSON 배열의 각 객체를 age(만 나이)로 변환합니다.
-- age = 현재 연도 - birth_year (단, 0~100 범위로 클리핑)
-- =============================================================================

-- 1. 적용 대상 확인 (실행 전 참고용)
-- SELECT id, user_id, children FROM public.profiles
-- WHERE children IS NOT NULL AND jsonb_array_length(children) > 0;

-- 2. children 배열의 각 요소: birth_year 있으면 age로 변환, 없으면 유지
UPDATE public.profiles p
SET children = (
  SELECT COALESCE(
    jsonb_agg(
      CASE
        WHEN elem ? 'birth_year' THEN
          jsonb_build_object(
            'name', elem->'name',
            'age', LEAST(100, GREATEST(0, EXTRACT(YEAR FROM NOW())::int - (elem->>'birth_year')::int)),
            'gender', elem->'gender'
          )
        ELSE
          elem
      END
    ),
    '[]'::jsonb
  )
  FROM jsonb_array_elements(COALESCE(p.children, '[]'::jsonb)) AS elem
)
WHERE p.children IS NOT NULL;

-- 3. 적용 결과 확인 (실행 후 참고용)
-- SELECT id, user_id, children FROM public.profiles
-- WHERE children IS NOT NULL AND jsonb_array_length(children) > 0;
