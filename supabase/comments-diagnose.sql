-- 예전 리뷰이 안 보일 때 원인 확인용 (Supabase SQL Editor에서 실행)

-- 1) 현재 학원 목록과 ID
SELECT id, name, address FROM public.academies ORDER BY name;

-- 2) 리뷰 개수 (전체 / 숨김 제외)
SELECT
  (SELECT count(*) FROM public.comments) AS total,
  (SELECT count(*) FROM public.comments WHERE is_hidden = false) AS visible;

-- 3) "고아" 리뷰: academy_id가 현재 academies에 없는 리뷰 (= 학원 ID가 바뀌어서 안 보이는 리뷰)
SELECT c.id, c.academy_id, c.content, c.created_at
FROM public.comments c
LEFT JOIN public.academies a ON a.id = c.academy_id
WHERE a.id IS NULL
ORDER BY c.created_at DESC;

-- 4) 학원별 리뷰 수 (현재 학원 ID 기준)
SELECT a.name, a.id, count(c.id) AS comment_count
FROM public.academies a
LEFT JOIN public.comments c ON c.academy_id = a.id AND c.is_hidden = false
GROUP BY a.id, a.name
ORDER BY comment_count DESC;
