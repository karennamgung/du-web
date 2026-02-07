import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl) {
  throw new Error(
    'VITE_SUPABASE_URL이 설정되지 않았습니다. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서 추가한 뒤 재배포하세요.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
