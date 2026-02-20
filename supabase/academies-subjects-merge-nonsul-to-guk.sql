-- 논술 → 국어 통합 + 중복 제거: academies.subjects 배열 안의 '논술'을 '국어'로 바꾸고 중복 제거 (첫 등장 순서 유지)
-- 실행 전: SELECT id, name, subjects FROM public.academies WHERE '논술' = ANY(subjects);
-- 실행 후: 동일 쿼리로 확인 (결과 없음이면 정상)

UPDATE public.academies
SET subjects = (
  SELECT COALESCE(array_agg(elem ORDER BY first_ord), '{}')
  FROM (
    SELECT
      CASE WHEN elem = '논술' THEN '국어' ELSE elem END AS elem,
      min(ord) AS first_ord
    FROM unnest(subjects) WITH ORDINALITY AS t(elem, ord)
    GROUP BY CASE WHEN elem = '논술' THEN '국어' ELSE elem END
  ) AS deduped
)
WHERE '논술' = ANY(subjects);
