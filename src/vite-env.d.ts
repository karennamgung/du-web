/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_NAVER_MAP_CLIENT_ID: string
  /** NCP 역지오코딩(내 동네)용 API Key (Secret). 없으면 내 동네 자동 설정 불가 */
  readonly VITE_NCP_API_KEY?: string
  readonly VITE_NAVER_MAP_CLIENT_SECRET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    naver?: unknown
  }
}

export {}
