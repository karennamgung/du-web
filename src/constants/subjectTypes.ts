import {
  mdiCircle,
  mdiHome, // 지도 내 위치 마커용
  mdiTranslate, // 영어
  mdiCalculator, // 수학
  mdiFlask, // 과학
  mdiBookOpen, // 국어
  mdiPencil, // 논술
  mdiCodeTags, // 코딩·로봇
  mdiMusic, // 음악
  mdiPalette, // 미술·디자인
  mdiDumbbell, // 스포츠
  mdiDanceBallroom, // 무용
} from '@mdi/js'

/** 과목별 MDI 아이콘 매핑 (통합 10개만, 지도 마커·필터 칩 공통) */
export const SUBJECT_ICON_MAP: Record<string, string> = {
  '영어': mdiTranslate,
  '수학': mdiCalculator,
  '과학': mdiFlask,
  '국어': mdiBookOpen,
  '논술': mdiPencil,
  '코딩': mdiCodeTags,
  '음악': mdiMusic,
  '미술': mdiPalette,
  '스포츠': mdiDumbbell,
  '무용': mdiDanceBallroom,
}

/** 기본 아이콘 (과목이 없거나 매핑되지 않은 경우) */
export const DEFAULT_SUBJECT_ICON = mdiCircle

/** 지도 내 위치 마커 아이콘 (학원 마커와 구분) */
export const MY_LOCATION_MARKER_ICON = mdiHome

/** 연령 그룹 순서 (정렬용, 표준 리스트와 동일) */
export const AGE_GROUP_ORDER = ['고등', '중등', '초등', '유치'] as const

/** 표준 연령 그룹 리스트 (AGE_GROUP_ORDER와 동일) */
export const AGE_GROUP_LIST = AGE_GROUP_ORDER

/** 표준 과목 리스트 (통합된 10개, 필터·정렬용) */
export const SUBJECT_LIST = [
  '영어',
  '수학',
  '과학',
  '국어',
  '논술',
  '코딩',
  '음악',
  '미술',
  '스포츠',
  '무용',
] as const

/** 타입 정의 */
export type Subject = (typeof SUBJECT_LIST)[number]
export type AgeGroup = (typeof AGE_GROUP_LIST)[number]

/** 과목에 해당하는 아이콘 경로 반환 (통합명·별칭 모두 처리) */
export function getSubjectIcon(subject: string | null | undefined): string {
  if (!subject) return DEFAULT_SUBJECT_ICON
  const canonical = getCanonicalSubject(subject)
  return canonical ? SUBJECT_ICON_MAP[canonical] : DEFAULT_SUBJECT_ICON
}

/** 학원 과목 배열에서 대표 과목 아이콘 경로 반환 (지도 마커용, 첫 번째 과목 사용) */
export function getSubjectIconPath(subjects: string[] | null | undefined): string {
  if (!subjects || subjects.length === 0) return getSubjectIcon(null)
  return getSubjectIcon(subjects[0])
}

/** 통합된 표준 과목명 매핑 (별칭 → 통합명, 유효 과목 판별·아이콘 조회용) */
const CANONICAL_SUBJECT_MAP: Record<string, Subject> = {
  영어: '영어',
  수학: '수학',
  과학: '과학',
  국어: '국어',
  논술: '논술',
  코딩: '코딩',
  로봇: '코딩',
  음악: '음악',
  피아노: '음악',
  미술: '미술',
  디자인: '미술',
  스포츠: '스포츠',
  축구: '스포츠',
  농구: '스포츠',
  수영: '스포츠',
  체육: '스포츠',
  무용: '무용',
  발레: '무용',
  현대무용: '무용',
  댄스: '무용',
}

export function getCanonicalSubject(subject: string): Subject | null {
  return CANONICAL_SUBJECT_MAP[subject] ?? null
}

/** 유효한 과목인지 확인 (통합명·별칭 모두 유효) */
export function isValidSubject(subject: string): subject is Subject {
  return subject in CANONICAL_SUBJECT_MAP
}

/** 학원 과목 배열 → 카드·상세 페이지에 표시할 태그 (DB 원본 그대로, 유효한 과목만) */
export function getDisplaySubjects(subjects: string[] | null | undefined): string[] {
  if (!subjects || subjects.length === 0) return []
  return subjects.filter(isValidSubject)
}

/** 유효한 연령 그룹인지 확인 */
export function isValidAgeGroup(ageGroup: string): ageGroup is AgeGroup {
  return AGE_GROUP_LIST.includes(ageGroup as AgeGroup)
}
