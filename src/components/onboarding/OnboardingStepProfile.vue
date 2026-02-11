<template>
  <div class="onboarding-step">
    <h1 class="step-title">프로필을 만들어보세요!</h1>
    <p class="step-description">크리에이터를 비롯한 다른 사람들과 소통할 나만의 프로필이예요.</p>

    <div class="profile-form">
      <div class="input-group">
        <label for="nickname">별명</label>
        <input
          id="nickname"
          v-model="nickname"
          type="text"
          placeholder="별명을 입력해주세요"
          class="input"
          maxlength="20"
          @input="validateNickname"
        />
        <p class="input-hint">한글1~10자, 영문 및 숫자 2~20자까지 입력할 수 있어요.</p>
        <p v-if="nicknameError" class="input-error">{{ nicknameError }}</p>
      </div>

      <div class="avatar-section">
        <label>프로필 이미지</label>
        <div class="avatar-grid">
          <button
            v-for="(avatar, index) in defaultAvatars"
            :key="index"
            type="button"
            class="avatar-option"
            :class="{ selected: selectedAvatarIndex === index }"
            @click="selectAvatar(index)"
          >
            <Avatar
              :profile-image-url="toDefaultAvatarUrl(avatar.letter)"
              nickname=""
              size="md"
            />
            <span v-if="selectedAvatarIndex === index" class="avatar-check">✓</span>
          </button>
        </div>
        <button
          type="button"
          class="btn btn-outline w-full mt-md"
          @click="handleImageUpload"
        >
          사진 직접 업로드
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>
    </div>

    <button
      type="button"
      class="btn btn-primary w-full mt-xl"
      :disabled="!canProceed"
      @click="handleNext"
    >
      다음
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import Avatar from '@/components/shared/Avatar.vue'
import {
  DEFAULT_AVATARS,
  isDefaultAvatarUrl,
  getDefaultAvatarLetterFromUrl,
  toDefaultAvatarUrl,
} from '@/constants/avatars'

interface Props {
  onboardingData: {
    nickname: string
    profileImageUrl: string | null
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { nickname: string; profileImageUrl: string | null }]
  next: []
}>()

const auth = useAuthStore()

function getInitialAvatarIndex(profileImageUrl: string | null): number | null {
  if (!profileImageUrl) return 0
  if (isDefaultAvatarUrl(profileImageUrl)) {
    const letter = getDefaultAvatarLetterFromUrl(profileImageUrl)
    const idx = DEFAULT_AVATARS.findIndex((a) => a.letter === letter)
    return idx >= 0 ? idx : 0
  }
  return null // 업로드 이미지
}

const nickname = ref(props.onboardingData.nickname || '')
const nicknameError = ref('')
const selectedAvatarIndex = ref<number | null>(getInitialAvatarIndex(props.onboardingData.profileImageUrl))
const profileImageUrl = ref<string | null>(props.onboardingData.profileImageUrl)
const fileInput = ref<HTMLInputElement | null>(null)

const defaultAvatars = DEFAULT_AVATARS

const canProceed = computed(() => {
  const hasNickname = nickname.value.trim().length > 0
  const noNicknameError = !nicknameError.value
  const hasImage = profileImageUrl.value !== null || selectedAvatarIndex.value !== null
  
  const result = hasNickname && noNicknameError && hasImage
  
  console.log('[OnboardingStepProfile] canProceed 체크:', {
    hasNickname,
    noNicknameError,
    hasImage,
    result,
  })
  
  return result
})

function validateNickname() {
  const value = nickname.value.trim()
  if (value.length === 0) {
    nicknameError.value = ''
    return
  }

  const koreanRegex = /^[가-힣]+$/
  const englishNumberRegex = /^[a-zA-Z0-9]+$/

  if (koreanRegex.test(value)) {
    if (value.length < 1 || value.length > 10) {
      nicknameError.value = '한글은 1~10자까지 입력할 수 있어요.'
      return
    }
  } else if (englishNumberRegex.test(value)) {
    if (value.length < 2 || value.length > 20) {
      nicknameError.value = '영문 및 숫자는 2~20자까지 입력할 수 있어요.'
      return
    }
  } else {
    nicknameError.value = '한글 또는 영문 및 숫자만 입력할 수 있어요.'
    return
  }

  nicknameError.value = ''
}

function selectAvatar(index: number) {
  selectedAvatarIndex.value = index
  profileImageUrl.value = null
  emit('update-data', { nickname: nickname.value, profileImageUrl: toDefaultAvatarUrl(DEFAULT_AVATARS[index].letter) })
}

function handleImageUpload() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !auth.user?.id) return

  try {
    // 파일 업로드
    const fileExt = file.name.split('.').pop()
    const fileName = `${auth.user.id}-${Date.now()}.${fileExt}`
    const filePath = `profiles/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // 공개 URL 가져오기
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    profileImageUrl.value = data.publicUrl
    selectedAvatarIndex.value = null // 업로드 이미지 선택 시 기본 아바타 선택 해제
    emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
  } catch (error) {
    console.error('Image upload failed:', error)
    alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
  }
}

function handleNext() {
  if (canProceed.value) {
    const finalImageUrl =
      profileImageUrl.value ?? (selectedAvatarIndex.value !== null ? toDefaultAvatarUrl(DEFAULT_AVATARS[selectedAvatarIndex.value].letter) : null)
    emit('update-data', { nickname: nickname.value, profileImageUrl: finalImageUrl })
    emit('next')
  } else {
    console.warn('[OnboardingStepProfile] 다음 단계로 진행할 수 없음:', {
      nickname: nickname.value,
      nicknameError: nicknameError.value,
      hasProfileImage: !!profileImageUrl.value,
      selectedAvatarIndex: selectedAvatarIndex.value,
    })
  }
}

watch(nickname, () => {
  validateNickname()
  emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
})

watch(profileImageUrl, () => {
  emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.onboarding-step {
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.step-title {
  @include v.text-heading-lg;
  margin: 0;
}

.step-description {
  @include v.text-body;
  color: v.$color-text-dim;
  margin: 0;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: v.$space-xl;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;

  label {
    @include v.text-heading-sm;
  }

  .input {
    @include v.input-base;
  }

  .input-hint {
    @include v.text-caption-sm;
    margin: 0;
  }

  .input-error {
    @include v.text-caption-sm;
    color: v.$color-accent-warning;
    margin: 0;
  }
}

.avatar-section {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;

  label {
    @include v.text-heading-sm;
  }
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: v.$space-md;
}

.avatar-option {
  position: relative;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
}

.avatar-option.selected :deep(.avatar) {
  border: 2px solid v.$color-primary;
  box-shadow: 0 0 0 2px v.$color-primary-dimmer;
}

.avatar-check {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 1.5rem;
  height: 1.5rem;
  background-color: v.$color-primary;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
}

.hidden {
  display: none;
}
</style>
