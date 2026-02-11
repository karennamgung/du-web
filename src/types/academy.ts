export interface Academy {
  id: string
  name: string
  /** 지번 주소 */
  address: string
  /** 도로명 주소 */
  address_road?: string | null
  subjects: string[]
  age_group?: string[] | null
  lat: number
  lng: number
  image_url?: string | null
  /** 맘까페·네이버 리뷰·플랫폼 리뷰·태그 종합 AI 분석 문구 (없으면 샘플 문구 표시) */
  ai_analysis?: string | null
}
