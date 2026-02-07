-- 학원 경험 태그 (user가 학원별로 선택한 경험 = 태그처럼 표시)
CREATE TABLE IF NOT EXISTS public.academy_experience_tags (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  tag_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, academy_id, tag_key)
);

-- RLS
ALTER TABLE public.academy_experience_tags ENABLE ROW LEVEL SECURITY;

-- 누구나 학원별 태그 개수/목록 조회 가능 (anon + authenticated)
DROP POLICY IF EXISTS "academy_experience_tags_select" ON public.academy_experience_tags;
CREATE POLICY "academy_experience_tags_select"
  ON public.academy_experience_tags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "academy_experience_tags_insert_own" ON public.academy_experience_tags;
CREATE POLICY "academy_experience_tags_insert_own"
  ON public.academy_experience_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "academy_experience_tags_delete_own" ON public.academy_experience_tags;
CREATE POLICY "academy_experience_tags_delete_own"
  ON public.academy_experience_tags FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
