<template>
  <div class="comment-composer">
    <h3 class="comment-composer-title">경험 남기기</h3>
    <textarea
      v-model="content"
      class="comment-composer-input"
      rows="3"
      placeholder="이 학원에 다녀본 경험을 남겨주세요."
      :disabled="submitting"
    />
    <button
      type="button"
      class="comment-composer-submit"
      :disabled="submitting || !content.trim()"
      @click="submit"
    >
      {{ submitting ? '등록 중...' : '등록' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  academyId: string
  selectedTagKeys?: string[]
}>()

const emit = defineEmits<{
  created: []
}>()

const auth = useAuthStore()
const content = ref('')
const submitting = ref(false)

function getNickname(): string | null {
  const meta = auth.user?.user_metadata as { nickname?: string; full_name?: string; name?: string } | undefined
  if (meta?.nickname?.trim()) return meta.nickname.trim()
  if (meta?.full_name?.trim()) return meta.full_name.trim()
  if (meta?.name?.trim()) return meta.name.trim()
  const email = auth.user?.email
  if (email) return email.split('@')[0] || null
  return null
}

async function submit() {
  if (submitting.value || !content.value.trim() || !auth.user?.id) return
  submitting.value = true
  try {
    const tagKeys = props.selectedTagKeys?.length ? props.selectedTagKeys : []
    const { error } = await supabase.from('comments').insert({
      academy_id: props.academyId,
      user_id: auth.user.id,
      content: content.value.trim(),
      is_hidden: false,
      nickname: getNickname(),
      tag_keys: tagKeys,
    })
    if (error) throw error
    content.value = ''
    emit('created')
  } catch (e) {
    console.error('Comment insert failed:', e)
    alert(e instanceof Error ? e.message : '리뷰 등록에 실패했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.comment-composer {
  margin-top: v.$space-lg;
  padding-top: v.$space-lg;
  border-top: 1px solid v.$color-border-dim;
}

.comment-composer-title {
  margin: 0 0 v.$space-md;
}

.comment-composer-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: v.$space-md;
  resize: vertical;
  @include v.input-base;
}

.comment-composer-submit {
  @include v.button-primary;

  &:disabled {
    @include v.button-disabled;
  }
}
</style>
