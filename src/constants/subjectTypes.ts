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

/**
 * 과목에 해당하는 아이콘 경로 반환 (필터·지도용)
 * 
 * DB 원본을 표준 태그로 변환한 후 아이콘을 반환
 * 예: "로봇" → "코딩" → 코딩 아이콘
 * 
 * @param subject - DB에서 가져온 원본 과목명
 * @returns MDI 아이콘 경로
 */
export function getSubjectIcon(subject: string | null | undefined): string {
  if (!subject) return DEFAULT_SUBJECT_ICON
  const canonical = getCanonicalSubject(subject)
  return canonical ? SUBJECT_ICON_MAP[canonical] : DEFAULT_SUBJECT_ICON
}

/**
 * 학원 과목 배열에서 대표 과목 아이콘 경로 반환 (지도 마커용)
 * 
 * 필터·지도용: 첫 번째 아이 과목을 표준 태그로 변환하여 아이콘 반환
 * 
 * @param subjects - DB에서 가져온 원본 과목 배열
 * @returns MDI 아이콘 경로
 */
export function getSubjectIconPath(subjects: string[] | null | undefined): string {
  if (!subjects || subjects.length === 0) return getSubjectIcon(null)
  return getSubjectIcon(subjects[0])
}

/**
 * 통합된 표준 과목명 매핑 (별칭 → 표준명)
 * 
 * 데이터베이스에서 들어오는 다양한 과목명을 표준 10개 과목으로 그룹핑
 * 필터·지도에서 사용 (카드·상세 페이지는 원본 그대로 표시)
 * 
 * 예: "로봇" → "코딩", "피아노" → "음악", "축구" → "스포츠"
 */
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

/**
 * DB 원본 과목명을 표준 태그로 변환 (필터·지도용)
 * 
 * @param subject - DB에서 가져온 원본 과목명
 * @returns 표준 태그 (매핑되지 않으면 null)
 */
export function getCanonicalSubject(subject: string): Subject | null {
  return CANONICAL_SUBJECT_MAP[subject] ?? null
}

/** 유효한 과목인지 확인 (통합명·별칭 모두 유효) */
export function isValidSubject(subject: string): subject is Subject {
  return subject in CANONICAL_SUBJECT_MAP
}

/**
 * 학원 과목 배열 → 카드·상세 페이지에 표시할 태그
 * 
 * 1. 데이터베이스에서 들어오는 태그는 학원 카드와 학원 상세정보 페이지에 모두 표시 (원본 그대로)
 * 2. 데이터베이스에서 들어오는 태그를 그룹핑하여 표준 태그로 매치하여 "필터" 및 "지도"에 사용
 * 
 * @param subjects - DB에서 가져온 원본 과목 배열
 * @returns 유효한 과목만 필터링하여 반환 (원본 그대로, 변환 없음)
 */
export function getDisplaySubjects(subjects: string[] | null | undefined): string[] {
  if (!subjects || subjects.length === 0) return []
  return subjects.filter(isValidSubject)
}

/**
 * 학원 과목 배열 → 필터·지도에 사용할 표준 태그 배열
 * 
 * DB 원본을 표준 태그로 변환하여 필터와 지도에서 사용
 * 예: "로봇" → "코딩", "피아노" → "음악", "축구" → "스포츠"
 * 
 * @param subjects - DB에서 가져온 원본 과목 배열
 * @returns 표준 태그 배열 (중복 제거, SUBJECT_LIST 순서)
 */
export function getCanonicalSubjects(subjects: string[] | null | undefined): Subject[] {
  if (!subjects || subjects.length === 0) return []
  const canonicalSet = new Set<Subject>()
  for (const s of subjects) {
    const canonical = getCanonicalSubject(s)
    if (canonical) canonicalSet.add(canonical)
  }
  // SUBJECT_LIST 순서로 정렬
  return Array.from(canonicalSet).sort((a, b) => {
    const i = SUBJECT_LIST.indexOf(a)
    const j = SUBJECT_LIST.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
}

/** 유효한 연령 그룹인지 확인 */
export function isValidAgeGroup(ageGroup: string): ageGroup is AgeGroup {
  return AGE_GROUP_LIST.includes(ageGroup as AgeGroup)
}

/**
 * 만 나이 → 연령 필터(연령 그룹) 매핑
 * 유치 0–6세, 초등 7–12세, 중등 13–15세, 고등 16세 이상
 */
export function getAgeGroupFromAge(age: number): AgeGroup {
  if (age <= 6) return '유치'
  if (age <= 12) return '초등'
  if (age <= 15) return '중등'
  return '고등'
}

/**
 * 만 나이 배열 → 연령 필터(연령 그룹) 배열 (중복 제거, AGE_GROUP_ORDER 순)
 */
export function getAgeGroupsFromAges(ages: number[]): AgeGroup[] {
  const set = new Set<AgeGroup>()
  ages.forEach((age) => set.add(getAgeGroupFromAge(age)))
  return Array.from(set).sort((a, b) => {
    const i = AGE_GROUP_ORDER.indexOf(a)
    const j = AGE_GROUP_ORDER.indexOf(b)
    return i - j
  })
}
