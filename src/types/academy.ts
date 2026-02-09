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

export const DUMMY_ACADEMIES: Academy[] = [
  { id: '1', name: '송도영어학원', address: '인천 연수구 송도대로 123', subjects: ['영어', '수학'], lat: 37.3820, lng: 126.6520 },
  { id: '2', name: '글로벌수학학원', address: '인천 연수구 컨벤시아대로 45', subjects: ['수학', '과학'], lat: 37.3860, lng: 126.6580 },
  { id: '3', name: '송도코딩센터', address: '인천 연수구 송바이오대로 78', subjects: ['코딩'], lat: 37.3800, lng: 126.6620 },
  { id: '4', name: '예림국어학원', address: '인천 연수구 인천타워대로 101', subjects: ['국어', '논술'], lat: 37.3880, lng: 126.6540 },
  { id: '5', name: '송도피아노학원', address: '인천 연수구 송도과학로 22', subjects: ['음악'], lat: 37.3840, lng: 126.6600 },
  { id: '6', name: '다담미술학원', address: '인천 연수구 아트센터대로 56', subjects: ['미술'], lat: 37.3780, lng: 126.6560 },
  { id: '7', name: '송도체육관', address: '인천 연수구 스포츠로 33', subjects: ['스포츠'], lat: 37.3900, lng: 126.6620 },
  { id: '8', name: '해법국어영어', address: '인천 연수구 컨벤시아대로 88', subjects: ['국어', '영어'], lat: 37.3810, lng: 126.6480 },
  { id: '9', name: '송도논술학원', address: '인천 연수구 송도교육로 11', subjects: ['논술', '국어', '영어'], lat: 37.3850, lng: 126.6500 },
  { id: '10', name: '키즈발레학원', address: '인천 연수구 송도대로 200', subjects: ['무용'], lat: 37.3790, lng: 126.6640 },
]
