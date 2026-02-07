/** 학원 경험 태그 정의 (긍정 / 부정) */
export const EXPERIENCE_TAGS_POSITIVE = [
  { key: 'good_explanation', label: '선생님 설명이 잘 들려요' },
  { key: 'good_materials', label: '교재가 체계적이에요' },
  { key: 'good_atmosphere', label: '분위기가 좋아요' },
  { key: 'recommend', label: '추천해요' },
  { key: 'clean_facility', label: '시설이 깔끔해요' },
  { key: 'friendly_staff', label: '선생님이 친절해요' },
  { key: 'reasonable_price', label: '가격이 합리적이에요' },
  { key: 'good_location', label: '위치가 좋아요' },
] as const

export const EXPERIENCE_TAGS_NEGATIVE = [
  { key: 'poor_explanation', label: '설명이 부족해요' },
  { key: 'poor_materials', label: '교재가 부실해요' },
  { key: 'stuffy_atmosphere', label: '분위기가 답답해요' },
  { key: 'not_recommend', label: '비추천해요' },
  { key: 'old_facility', label: '시설이 낡았어요' },
  { key: 'unfriendly_staff', label: '선생님이 불친절해요' },
  { key: 'expensive_price', label: '가격이 비싸요' },
  { key: 'bad_location', label: '위치가 불편해요' },
] as const

export const EXPERIENCE_TAGS = [...EXPERIENCE_TAGS_POSITIVE, ...EXPERIENCE_TAGS_NEGATIVE] as const

export type ExperienceTagKey = (typeof EXPERIENCE_TAGS)[number]['key']
