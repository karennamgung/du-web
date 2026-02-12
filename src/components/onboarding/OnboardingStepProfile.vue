<template>
  <div class="profile-form">
      <div class="input-group">
        <label for="nickname" class="text-caption-sm">별명</label>
        <input
          id="nickname"
          v-model="nickname"
          type="text"
          placeholder="별명을 입력해주세요"
          class="input"
          maxlength="20"
          @input="validateNickname"
        />
        <p v-if="!nicknameError" class="type-size-xs color-dim pl-lg">한글1~10자, 영문 및 숫자 2~20자까지 입력할 수 있어요.</p>
        <p v-if="nicknameError" class="input-error">{{ nicknameError }}</p>
      </div>

      <div class="input-group">
        <label class="text-caption-sm">프로필</label>
        <div class="profile-image-options">
          <button
            type="button"
            class="profile-image-btn"
            :class="{ selected: profileImageUrl === null }"
            @click="selectDefaultAvatar"
          >
            <Avatar
              :profile-image-url="null"
              :nickname="nickname"
              size="md"
            />
          </button>
          <button
            type="button"
            class="profile-image-btn"
            :class="{ selected: profileImageUrl !== null }"
            @click="handleImageUpload"
          >
            <Avatar
              :key="profileImageUrl ?? 'upload'"
              :profile-image-url="profileImageUrl ?? null"
              :nickname="nickname"
              size="md"
              placeholder-label="이미지 업로드"
            />
          </button>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileChange"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import Avatar from '@/components/shared/Avatar.vue'

interface Props {
  onboardingData: {
    nickname: string
    profileImageUrl: string | null
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { nickname: string; profileImageUrl: string | null }]
  'update:canProceed': [value: boolean]
  next: []
}>()

const auth = useAuthStore()

const nickname = ref(props.onboardingData.nickname || '')
const nicknameError = ref('')
const profileImageUrl = ref<string | null>(
  props.onboardingData.profileImageUrl?.startsWith('http') ? props.onboardingData.profileImageUrl : null
)
const fileInput = ref<HTMLInputElement | null>(null)

const canProceed = computed(() => {
  const hasNickname = nickname.value.trim().length > 0
  const noNicknameError = !nicknameError.value
  const hasImageChoice = true
  return hasNickname && noNicknameError && hasImageChoice
})

watch(
  [nickname, nicknameError],
  () => emit('update:canProceed', canProceed.value),
  { immediate: true },
)

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

function selectDefaultAvatar() {
  profileImageUrl.value = null
  emit('update-data', { nickname: nickname.value, profileImageUrl: null })
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
    const publicUrl = data.publicUrl
    profileImageUrl.value = publicUrl
    emit('update-data', { nickname: nickname.value, profileImageUrl: publicUrl })
    target.value = ''
  } catch (error) {
    console.error('Image upload failed:', error)
    alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.')
  }
}

function requestNext() {
  if (canProceed.value) {
    emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
    emit('next')
  }
}

defineExpose({
  requestNext,
  canProceed,
})

watch(nickname, () => {
  validateNickname()
  emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
})

watch(profileImageUrl, () => {
  emit('update-data', { nickname: nickname.value, profileImageUrl: profileImageUrl.value })
})
</script>

<style lang="scss" scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: v.$space-xl;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;
}

.profile-image-options {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
}

.profile-image-btn {
  flex-shrink: 0;
  padding: 0;
  border: 1px solid v.$color-bg-base;
  border-radius: 50%;
  cursor: pointer;
  background: none;
  transition: box-shadow v.$transition-fast;

  @media (hover: hover) {
    &:hover {
      box-shadow: 0 0 0 2px v.$color-border-focus;
    }
  }

  &.selected {
    box-shadow: 0 0 0 2px v.$color-border-focus;
  }
}

.hidden {
  display: none;
}
</style>
