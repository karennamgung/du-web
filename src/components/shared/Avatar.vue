<template>
  <div class="avatar" :class="sizeClass">
    <img
      v-if="avatarImageUrl"
      :src="avatarImageUrl"
      :alt="nickname || '프로필'"
      class="avatar__img"
    />
    <span
      v-else-if="placeholderLabel"
      class="type-size-xs color-dimmer type-weight-semibold"
    >
      {{ placeholderLabel }}
    </span>
    <p v-else class="color-inverse type-weight-semibold">
      {{ avatarLetter }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  isDefaultAvatarUrl,
  getDefaultAvatarLetterFromUrl,
  getDisplayLetterFromNickname,
} from '@/constants/avatars'

const props = withDefaults(
  defineProps<{
    /** 프로필 이미지 URL (avatar:LETTER 형식이면 기본 아바타, 그 외 URL이면 업로드 이미지) */
    profileImageUrl?: string | null
    /** 닉네임 (기본 아바타가 없을 때 글자·색 폴백용) */
    nickname?: string
    /** 크기: sm(헤더 등), md(온보딩 그리드 등), lg */
    size?: 'sm' | 'md' | 'lg'
    /** 이미지가 없을 때 표시할 문구 (예: '이미지 업로드'). 있으면 글자 대신 이 문구 표시 */
    placeholderLabel?: string
  }>(),
  { nickname: '', size: 'md', placeholderLabel: '' }
)

const sizeClass = computed(() => `avatar--${props.size}`)

/** 업로드된 이미지 URL (기본 아바타가 아닐 때만) */
const avatarImageUrl = computed(() => {
  const url = props.profileImageUrl
  if (!url || isDefaultAvatarUrl(url)) return null
  return url
})

/** 표시할 글자: 프로필 닉네임 첫 글자 (한글 한 글자, 영문 대문자). 닉네임 없을 때는 avatar:X에서 추출(온보딩 그리드용) */
const avatarLetter = computed(() => {
  const nick = (props.nickname ?? '').trim()
  if (nick) return getDisplayLetterFromNickname(nick)
  const url = props.profileImageUrl
  if (url && isDefaultAvatarUrl(url)) {
    const letter = getDefaultAvatarLetterFromUrl(url)
    if (letter) return letter
  }
  return getDisplayLetterFromNickname('')
})
</script>

<style lang="scss" scoped>
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background-color: v.$color-bg-strongest;
  word-break: keep-all;
}

.avatar--sm {
  width: 2.25rem;
  height: 2.25rem;
}

.avatar--md {
  width: 3.25rem;
  height: 3.25rem;
}

.avatar--lg {
  width: 5rem;
  height: 5rem;
}

.avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
