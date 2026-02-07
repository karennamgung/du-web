import {
  mdiCircle,
  mdiTranslate, // 영어
  mdiCalculator, // 수학
  mdiFlask, // 과학
  mdiBookOpen, // 국어
  mdiPencil, // 논술
  mdiCodeTags, // 코딩
  mdiRobot, // 로봇
  mdiMusic, // 음악/피아노
  mdiPalette, // 미술
  mdiDumbbell, // 체육
  mdiDanceBallroom, // 발레/무용
} from '@mdi/js'

/** 과목별 MDI 아이콘 매핑 (대표 과목에 따라 다른 아이콘 사용) */
export const SUBJECT_ICON_MAP: Record<string, string> = {
  '영어': mdiTranslate,
  '수학': mdiCalculator,
  '과학': mdiFlask,
  '국어': mdiBookOpen,
  '논술': mdiPencil,
  '코딩': mdiCodeTags,
  '로봇': mdiRobot,
  '피아노': mdiMusic,
  '음악이론': mdiMusic,
  '음악': mdiMusic,
  '미술': mdiPalette,
  '디자인': mdiPalette,
  '축구': mdiDumbbell,
  '농구': mdiDumbbell,
  '수영': mdiDumbbell,
  '체육': mdiDumbbell,
  '발레': mdiDanceBallroom,
  '현대무용': mdiDanceBallroom,
  '무용': mdiDanceBallroom,
}

/** 기본 아이콘 (과목이 없거나 매핑되지 않은 경우) */
export const DEFAULT_SUBJECT_ICON = mdiCircle

/** 연령 그룹 순서 (정렬용, 표준 리스트와 동일) */
export const AGE_GROUP_ORDER = ['고등', '중등', '초등', '유치'] as const

/** 표준 연령 그룹 리스트 (AGE_GROUP_ORDER와 동일) */
export const AGE_GROUP_LIST = AGE_GROUP_ORDER

/** 표준 과목 리스트 (SUBJECT_ICON_MAP의 키에서 자동 생성) */
export const SUBJECT_LIST = Object.keys(SUBJECT_ICON_MAP) as readonly string[]

/** 타입 정의 */
export type Subject = (typeof SUBJECT_LIST)[number]
export type AgeGroup = (typeof AGE_GROUP_LIST)[number]

/** 과목에 해당하는 아이콘 경로 반환 */
export function getSubjectIcon(subject: string | null | undefined): string {
  if (!subject) return DEFAULT_SUBJECT_ICON
  return SUBJECT_ICON_MAP[subject] || DEFAULT_SUBJECT_ICON
}

/** 유효한 과목인지 확인 */
export function isValidSubject(subject: string): subject is Subject {
  return subject in SUBJECT_ICON_MAP
}

/** 유효한 연령 그룹인지 확인 */
export function isValidAgeGroup(ageGroup: string): ageGroup is AgeGroup {
  return AGE_GROUP_LIST.includes(ageGroup as AgeGroup)
}
