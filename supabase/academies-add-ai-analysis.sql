-- academies.ai_analysis: 맘까페·네이버 리뷰·플랫폼 리뷰·태그 종합 AI 분석 문구
ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS ai_analysis text;
