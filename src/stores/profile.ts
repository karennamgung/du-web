import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export interface Child {
  name: string
  age: number
  gender: 'male' | 'female' | null
}

export interface Profile {
  id: string
  user_id: string
  user_type: 'parent' | 'student' | 'academy'
  nickname: string
  profile_image_url: string | null
  residence: string | null
  children: Child[] | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

/** user_type 표시 라벨 (학부모 / 학생 / 학원) */
export const USER_TYPE_LABELS: Record<Profile['user_type'], string> = {
  parent: '학부모',
  student: '학생',
  academy: '학원',
}

export function getUserTypeLabel(userType: Profile['user_type'] | null | undefined): string {
  if (!userType) return '—'
  return USER_TYPE_LABELS[userType] ?? '—'
}

export const useProfileStore = defineStore('profile', () => {
  const auth = useAuthStore()
  const profile = ref<Profile | null>(null)
  const children = ref<Child[]>([])
  const loading = ref(false)
  // 선택된 아이 인덱스 (null이면 학부모 이름 선택, 숫자면 해당 인덱스의 아이 선택)
  const selectedChildIndex = ref<number | null>(null)

  const isOnboardingCompleted = computed(() => profile.value?.onboarding_completed ?? false)
  
  // 현재 선택된 아이 (null이면 학부모 이름)
  const currentChild = computed(() => {
    if (selectedChildIndex.value === null) return null
    return children.value[selectedChildIndex.value] || null
  })
  
  // 헤더에 표시할 이름
  const displayName = computed(() => {
    if (!profile.value) return ''
    
    if (profile.value.user_type === 'parent') {
      // 학부모인 경우: 선택된 아이 이름 또는 학부모 이름
      if (currentChild.value) {
        return currentChild.value.name
      }
      return profile.value.nickname
    } else if (profile.value.user_type === 'student') {
      // 학생인 경우: 학생 이름
      return profile.value.nickname
    }
    
    return profile.value.nickname
  })

  async function loadProfile() {
    if (!auth.user?.id) {
      console.log('[Profile Store] 사용자 ID 없음, 프로필 초기화')
      profile.value = null
      children.value = []
      return
    }

    console.log('[Profile Store] 프로필 로드 시작, user_id:', auth.user.id)
    loading.value = true
    try {
      // 프로필 로드 - maybeSingle()을 사용하여 프로필이 없어도 에러 없이 처리
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', auth.user.id)
        .maybeSingle()

      // maybeSingle()은 프로필이 없을 때 null을 반환하고 에러를 발생시키지 않음
      if (profileError) {
        console.log('[Profile Store] 프로필 로드 에러:', {
          code: profileError.code,
          message: profileError.message,
        })
        
        // 42P01은 "relation does not exist" 에러 (테이블이 없는 경우)
        if (profileError.code === '42P01') {
          console.warn('[Profile Store] Profiles 테이블이 없습니다. setup-onboarding.sql을 실행해주세요.')
          profile.value = null
        } else {
          // 다른 에러는 로그만 남기고 계속 진행
          console.error('[Profile Store] 프로필 로드 에러:', profileError)
          profile.value = null
        }
      } else {
        // profileData가 null이면 프로필이 없는 것 (정상)
        console.log('[Profile Store] 프로필 로드 완료:', {
          hasProfile: !!profileData,
          onboardingCompleted: profileData?.onboarding_completed,
          childrenCount: profileData?.children?.length || 0,
        })
        profile.value = profileData || null
        
        // 아이 정보는 profiles.children JSON 필드에서 가져옴 (저장된 값 정규화: birth_year → age 보정)
        const rawChildren = profile.value?.children || []
        children.value = rawChildren.map((raw: Record<string, unknown>) => {
          const hasAge = typeof (raw as Child).age === 'number'
          const birthYear = typeof (raw as { birth_year?: number }).birth_year === 'number'
            ? (raw as { birth_year: number }).birth_year
            : null
          const age = hasAge
            ? (raw as Child).age
            : birthYear != null
              ? Math.min(100, Math.max(0, new Date().getFullYear() - birthYear))
              : 10
          return {
            name: String((raw as Child).name ?? ''),
            age,
            gender: ((raw as Child).gender as Child['gender']) ?? null,
          }
        })
        
        // 선택된 아이 인덱스 초기화 (첫 번째 아이 또는 null)
        if (children.value.length > 0) {
          // localStorage에서 저장된 선택값 복원 시도
          try {
            const saved = localStorage.getItem(`selectedChildIndex_${auth.user.id}`)
            if (saved !== null) {
              const index = parseInt(saved, 10)
              if (index >= 0 && index < children.value.length) {
                selectedChildIndex.value = index
              } else {
                selectedChildIndex.value = 0 // 첫 번째 아이 아이
              }
            } else {
              selectedChildIndex.value = 0 // 첫 번째 아이 아이
            }
          } catch {
            selectedChildIndex.value = 0 // 첫 번째 아이 아이
          }
        } else {
          selectedChildIndex.value = null
        }
      }
    } catch (e) {
      console.error('Profile load failed:', e)
      profile.value = null
      children.value = []
    } finally {
      loading.value = false
    }
  }

  async function refresh() {
    await loadProfile()
  }
  
  function selectChild(index: number | null) {
    selectedChildIndex.value = index
    // localStorage에 저장
    if (auth.user?.id) {
      if (index === null) {
        localStorage.removeItem(`selectedChildIndex_${auth.user.id}`)
      } else {
        localStorage.setItem(`selectedChildIndex_${auth.user.id}`, String(index))
      }
    }
  }

  return {
    profile,
    children,
    loading,
    isOnboardingCompleted,
    currentChild,
    selectedChildIndex,
    displayName,
    loadProfile,
    refresh,
    selectChild,
  }
})
