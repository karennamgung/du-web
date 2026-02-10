<template>
  <div class="onboarding-container">
    <div class="onboarding-header">
      <button
        v-if="currentStep > 0"
        type="button"
        class="btn btn-ghost btn-icon btn-rounded"
        aria-label="뒤로가기"
        @click="goBack"
      >
        <Icon :path="mdiChevronLeft" />
      </button>
      <button
        v-if="canSkip"
        type="button"
        class="btn btn-ghost"
        @click="skip"
      >
        건너뛰기
      </button>
    </div>

    <div class="onboarding-content">
      <div v-if="!currentStepComponent" class="loading-state">
        <p>로딩 중...</p>
      </div>
      <component
        v-else
        :is="currentStepComponent"
        :onboarding-data="onboardingData"
        @update-data="handleUpdateData"
        @next="handleNext"
        @complete="handleStepComplete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { mdiChevronLeft } from '@mdi/js'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { supabase } from '@/lib/supabase'
import OnboardingStepTerms from '@/components/onboarding/OnboardingStepTerms.vue'
import OnboardingStepUserType from '@/components/onboarding/OnboardingStepUserType.vue'
import OnboardingStepProfile from '@/components/onboarding/OnboardingStepProfile.vue'
import OnboardingStepResidence from '@/components/onboarding/OnboardingStepResidence.vue'
import OnboardingStepChildren from '@/components/onboarding/OnboardingStepChildren.vue'

interface OnboardingData {
  termsAgreed: boolean
  userType: 'parent' | 'student' | 'academy' | null
  nickname: string
  profileImageUrl: string | null
  residence: string | null
  children: Array<{
    name: string
    age: number
    gender: 'male' | 'female' | null
  }>
}

const router = useRouter()
const auth = useAuthStore()
const profile = useProfileStore()

const currentStep = ref(0)
const onboardingData = ref<OnboardingData>({
  termsAgreed: false,
  userType: null,
  nickname: '',
  profileImageUrl: null,
  residence: null,
  children: [],
})

const steps = computed(() => {
  const baseSteps = [
    { component: OnboardingStepTerms, canSkip: false },
    { component: OnboardingStepUserType, canSkip: false },
    { component: OnboardingStepProfile, canSkip: false },
    { component: OnboardingStepResidence, canSkip: false },
  ]

  // 학부모인 경우 아이 등록 단계 추가
  if (onboardingData.value.userType === 'parent') {
    baseSteps.push({ component: OnboardingStepChildren, canSkip: true })
  }

  console.log('[OnboardingView] steps 계산:', {
    userType: onboardingData.value.userType,
    totalSteps: baseSteps.length,
    stepNames: baseSteps.map((s, i) => `${i}: ${s.component.name || s.component.__name || 'Unknown'}`),
  })

  return baseSteps
})

const currentStepComponent = computed(() => {
  const component = steps.value[currentStep.value]?.component
  console.log('[OnboardingView] 현재 스텝 컴포넌트:', {
    step: currentStep.value,
    totalSteps: steps.value.length,
    hasComponent: !!component,
    componentName: component?.name || component?.__name || 'Unknown',
  })
  return component
})

const canSkip = computed(() => {
  return steps.value[currentStep.value]?.canSkip ?? false
})

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function skip() {
  handleComplete()
}

function handleUpdateData(data: Partial<OnboardingData>) {
  onboardingData.value = { ...onboardingData.value, ...data }
}

// userType이 변경되면 스텝 조정
watch(
  () => onboardingData.value.userType,
  (newType, oldType) => {
    // userType이 설정되고 현재 스텝이 프로필 이전이면 프로필 스텝으로 이동
    if (newType && !oldType && currentStep.value < 2) {
      // 이미 유형 선택 스텝을 지났으므로 그대로 진행
    }
    // 학부모가 아닌데 아이 등록 스텝에 있으면 이전 스텝으로
    if (newType !== 'parent' && currentStep.value >= steps.value.length - 1) {
      currentStep.value = steps.value.length - 2
    }
  }
)

function handleNext() {
  console.log('[OnboardingView] handleNext 호출:', {
    currentStep: currentStep.value,
    totalSteps: steps.value.length,
    userType: onboardingData.value.userType,
    isLastStep: currentStep.value >= steps.value.length - 1,
  })
  
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    console.log('[OnboardingView] 다음 스텝으로 이동:', currentStep.value)
  } else {
    console.log('[OnboardingView] 마지막 스텝, 완료 처리')
    handleComplete()
  }
}

function handleStepComplete() {
  console.log('[OnboardingView] handleStepComplete 호출 (아이 등록 완료)')
  // 아이 등록 단계에서 완료 이벤트가 발생하면 온보딩 전체 완료
  handleComplete()
}

async function handleComplete() {
  if (!auth.user?.id) {
    console.error('[OnboardingView] 완료 시도했지만 인증되지 않음')
    alert('온보딩을 완료하려면 로그인이 필요합니다.')
    // 로그인 모달을 열거나 로그인 페이지로 리디렉션
    return
  }

  console.log('[OnboardingView] 온보딩 완료 시작:', {
    userType: onboardingData.value.userType,
    nickname: onboardingData.value.nickname,
    hasResidence: !!onboardingData.value.residence,
    hasProfileImage: !!onboardingData.value.profileImageUrl,
    childrenCount: onboardingData.value.children.length,
  })

  try {
    // 필수 필드 검증
    if (!onboardingData.value.userType) {
      throw new Error('사용자 유형을 선택해주세요.')
    }
    if (!onboardingData.value.nickname.trim()) {
      throw new Error('별명을 입력해주세요.')
    }

    // 프로필 저장
    const profilePayload: any = {
      id: auth.user.id,
      user_id: auth.user.id,
      user_type: onboardingData.value.userType,
      nickname: onboardingData.value.nickname.trim(),
      residence: onboardingData.value.residence || null,
      onboarding_completed: true,
    }

    // 프로필 이미지가 있으면 추가 (없어도 됨)
    if (onboardingData.value.profileImageUrl) {
      profilePayload.profile_image_url = onboardingData.value.profileImageUrl
    } else {
      profilePayload.profile_image_url = null
    }

    // 학부모인 경우 아이 정보를 JSON 배열로 변환하여 profiles.children에 저장
    if (onboardingData.value.userType === 'parent') {
      const childrenData = onboardingData.value.children
        .filter((child) => child.name.trim().length > 0) // 이름이 있는 아이만 저장
        .map((child) => ({
          name: child.name.trim(),
          age: child.age,
          gender: child.gender,
        }))
      
      profilePayload.children = childrenData.length > 0 ? childrenData : []
      console.log('[OnboardingView] 아이 정보 포함:', childrenData)
    } else {
      profilePayload.children = []
    }

    console.log('[OnboardingView] 프로필 저장 시도:', profilePayload)
    const { error: profileError } = await supabase.from('profiles').upsert(profilePayload)

    if (profileError) {
      console.error('[OnboardingView] 프로필 저장 에러:', profileError)
      throw profileError
    }

    console.log('[OnboardingView] 프로필 저장 성공')

    // 프로필 스토어 새로고침
    console.log('[OnboardingView] 프로필 스토어 새로고침 시작')
    await profile.refresh()
    console.log('[OnboardingView] 프로필 스토어 새로고침 완료')

    // 리디렉션
    console.log('[OnboardingView] 리디렉션 시작:', onboardingData.value.userType)
    if (onboardingData.value.userType === 'academy') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (error) {
    console.error('[OnboardingView] 온보딩 완료 실패:', error)
    const errorMessage = error instanceof Error ? error.message : '온보딩 완료 중 오류가 발생했습니다.'
    alert(errorMessage + '\n\n콘솔을 확인해주세요.')
  }
}

onMounted(() => {
  console.log('[OnboardingView] 마운트됨', {
    authenticated: auth.isAuthenticated,
    hasProfile: !!profile.profile,
    onboardingCompleted: profile.isOnboardingCompleted,
  })
  
  // 인증되지 않은 사용자도 온보딩 페이지는 볼 수 있음
  // 하지만 완료하려면 로그인이 필요함
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.onboarding-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: v.$color-bg-base;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v.$space-md v.$space-lg;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: v.$space-lg;
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
}
</style>
