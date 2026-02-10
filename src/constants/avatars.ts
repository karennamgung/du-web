/**
 * 기본 프로필 아바타 목록 (온보딩·프로필 카드 등에서 공통 사용)
 */

export interface DefaultAvatar {
  letter: string
  color: string
}

export const DEFAULT_AVATARS: DefaultAvatar[] = [
  { letter: 'K', color: '#8B5CF6' },
  { letter: 'A', color: '#6B7280' },
  { letter: 'B', color: '#10B981' },
  { letter: 'C', color: '#F59E0B' },
  { letter: 'D', color: '#EF4444' },
  { letter: 'E', color: '#3B82F6' },
  { letter: 'F', color: '#EC4899' },
  { letter: 'G', color: '#14B8A6' },
  { letter: 'H', color: '#F97316' },
  { letter: 'I', color: '#6366F1' },
  { letter: 'J', color: '#84CC16' },
  { letter: 'L', color: '#A855F7' },
]

const AVATAR_PREFIX = 'avatar:'

/** profile_image_url이 기본 아바타 식별자(avatar:LETTER)인지 여부 */
export function isDefaultAvatarUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(AVATAR_PREFIX)
}

/** 기본 아바타 식별자에서 글자만 추출 (예: "avatar:K" → "K") */
export function getDefaultAvatarLetterFromUrl(value: string): string {
  if (!value.startsWith(AVATAR_PREFIX)) return ''
  return value.slice(AVATAR_PREFIX.length).trim() || ''
}

/** 글자로 기본 아바타 정보 조회 */
export function getDefaultAvatarByLetter(letter: string): DefaultAvatar | undefined {
  return DEFAULT_AVATARS.find((a) => a.letter === letter)
}

/** 인덱스로 기본 아바타 정보 조회 */
export function getDefaultAvatarByIndex(index: number): DefaultAvatar | undefined {
  return DEFAULT_AVATARS[index] ?? undefined
}

/** 선택한 기본 아바타를 profile_image_url에 저장할 값으로 변환 (avatar:LETTER) */
export function toDefaultAvatarUrl(letter: string): string {
  return `${AVATAR_PREFIX}${letter}`
}

/** 아바타 안에 표시할 글자: 별명의 첫 글자 (한글은 '김'처럼 한 글자, 영문/숫자는 대문자) */
export function getDisplayLetterFromNickname(nickname: string): string {
  const trimmed = nickname?.trim()
  if (!trimmed) return 'U'
  const first = trimmed.charAt(0)
  if (/[a-zA-Z]/.test(first)) return first.toUpperCase()
  return first
}

/** 닉네임으로 폴백용 색상 (저장된 아바타가 없을 때 사용, letter는 별명 첫 글자로 표시) */
export function getFallbackAvatarFromNickname(nickname: string): { letter: string; color: string } {
  const letter = getDisplayLetterFromNickname(nickname)
  const avatar = getDefaultAvatarByLetter(letter)
  return { letter, color: avatar?.color ?? DEFAULT_AVATARS[0].color }
}
