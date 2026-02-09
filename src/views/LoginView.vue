<template>
  <div class="login-view">
    <form v-if="!isSignUp" class="flex flex-col gap-sm" @submit.prevent="signIn">
      <input v-model="email" type="email" placeholder="이메일" class="input" required />
      <input v-model="password" type="password" placeholder="비밀번호" class="input" required />
      <p v-if="authError" class="color-warning">{{ authError }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="loading">로그인</button>
    </form>
    <form v-else class="flex flex-col gap-md" @submit.prevent="signUp">
      <input v-model="email" type="email" placeholder="이메일" class="input" required />
      <input
        v-model="nickname"
        type="text"
        placeholder="닉네임 (비우면 이메일 앞부분 사용)"
        class="input"
      />
      <input
        v-model="password"
        type="password"
        placeholder="비밀번호 (6자 이상)"
        class="input"
        required
        minlength="6"
      />
      <p v-if="authError" class="color-warning">{{ authError }}</p>
      <button type="submit" class="btn btn-primary w-full" :disabled="loading">가입하기</button>
    </form>
    <button type="button" class="link type-size-base mt-lg mb-lg" @click="isSignUp = !isSignUp">
      {{ isSignUp ? '이미 계정이 있어요' : '계정 만들기' }}
    </button>
    <p class="text-center">또는</p>
    <button type="button" class="btn btn-outline w-full mt-sm" :disabled="loading" @click="signInWithGoogle">
      Google로 로그인
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

interface Props {
  academyId?: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const auth = useAuthStore()
const email = ref('')
const nickname = ref('')
const password = ref('')
const loading = ref(false)
const authError = ref('')
const isSignUp = ref(false)

function resetForm() {
  authError.value = ''
  email.value = ''
  nickname.value = ''
  password.value = ''
}

watch(() => isSignUp.value, () => {
  resetForm()
})

function close() {
  resetForm()
  emit('close')
}

async function signIn() {
  authError.value = ''
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    if (error) throw error
    close()
  } catch (e) {
    authError.value = e instanceof Error ? e.message : '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function signUp() {
  authError.value = ''
  loading.value = true
  try {
    const displayName = nickname.value.trim() || email.value.split('@')[0] || ''
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: { data: { nickname: displayName } },
    })
    if (error) throw error
    authError.value = '가입 완료. 이메일 확인 후 로그인해 주세요.'
  } catch (e) {
    authError.value = e instanceof Error ? e.message : '가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function signInWithGoogle() {
  authError.value = ''
  loading.value = true
  try {
    if (props.academyId) sessionStorage.setItem('openComposerAfterAuth', props.academyId)
    const redirectTo = `${window.location.origin}${window.location.pathname}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    if (error) throw error
    close()
  } catch (e) {
    authError.value = e instanceof Error ? e.message : 'Google 로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-view {
  // 로그인 뷰 스타일은 필요시 추가
}
</style>
