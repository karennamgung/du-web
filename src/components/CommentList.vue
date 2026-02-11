<template>
  <div class="comment-list">
    <h3 class="comment-list-title">리뷰</h3>
    <p v-if="loading" class="comment-list-loading color-dim">불러오는 중...</p>
    <ul v-else-if="comments.length" class="comment-list-ul">
      <li v-for="c in comments" :key="c.id" class="comment-item">
        <template v-if="editingId === c.id">
          <textarea
            v-model="editingContent"
            class="comment-edit-input"
            rows="2"
            :disabled="updating"
          />
          <div class="comment-edit-actions">
            <button
              type="button"
              class="comment-btn comment-btn-primary type-size-sm"
              :disabled="updating || !editingContent.trim()"
              @click="saveEdit(c.id)"
            >
              저장
            </button>
            <button
              type="button"
              class="comment-btn type-size-sm"
              :disabled="updating"
              @click="cancelEdit"
            >
              취소
            </button>
          </div>
        </template>
        <template v-else>
          <p class="comment-content">{{ c.content }}</p>
          <div v-if="getCommentTagItems(c).length" class="comment-tags">
            <small
              v-for="item in getCommentTagItems(c)"
              :key="item.label"
              class="comment-tag-chip type-size-xs"
              :class="{
                'comment-tag-chip-negative color-negative-chip': item.isNegative,
                'color-primary': !item.isNegative,
              }"
            >
              {{ item.label }}
            </small>
          </div>
          <div class="comment-meta">
            <p class="comment-user-id color-dim">{{ displayAuthor(c) }}</p>
            <time class="comment-time type-size-xs color-dimmer">{{
              formatDate(c.created_at)
            }}</time>
            <span v-if="isOwnComment(c)" class="comment-actions">
              <button type="button" class="comment-link type-size-xs" @click="startEdit(c)">
                수정
              </button>
              <button
                type="button"
                class="comment-link comment-link-danger type-size-xs color-warning"
                @click="removeComment(c)"
              >
                삭제
              </button>
            </span>
          </div>
        </template>
      </li>
    </ul>
    <p v-else class="comment-list-empty color-dim">리뷰이 없습니다.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { EXPERIENCE_TAGS, EXPERIENCE_TAGS_NEGATIVE } from '@/constants/experienceTags'

const props = defineProps<{
  academyId: string | null
}>()

type CommentRow = {
  id: string
  content: string
  created_at: string
  user_id: string
  nickname?: string | null
  tag_keys?: string[] | null
}

const auth = useAuthStore()
const comments = ref<CommentRow[]>([])
const loading = ref(false)
const editingId = ref<string | null>(null)
const editingContent = ref('')
const updating = ref(false)

function isOwnComment(c: CommentRow) {
  return auth.user?.id && c.user_id === auth.user.id
}

function displayAuthor(c: CommentRow) {
  if (c.nickname?.trim()) return c.nickname.trim()
  if (!c.user_id) return ''
  const short = c.user_id.replace(/-/g, '').slice(-8)
  return short ? `ID: ${short}` : ''
}

const NEGATIVE_TAG_KEYS = new Set(EXPERIENCE_TAGS_NEGATIVE.map((t) => t.key))

function getCommentTagItems(c: CommentRow): { label: string; isNegative: boolean }[] {
  const keys = c.tag_keys
  if (!keys?.length) return []
  return keys
    .map((key) => {
      const label = EXPERIENCE_TAGS.find((t) => t.key === key)?.label ?? key
      return label ? { label, isNegative: NEGATIVE_TAG_KEYS.has(key) } : null
    })
    .filter((x): x is { label: string; isNegative: boolean } => x != null)
}

async function doFetch(academyId: string, withExtra = true): Promise<CommentRow[]> {
  const cols = withExtra
    ? 'id, content, created_at, user_id, nickname, tag_keys'
    : 'id, content, created_at, user_id'
  const result = await supabase
    .from('comments')
    .select(cols)
    .eq('academy_id', academyId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false })
  if (result.error) throw result.error
  const rows = (result.data ?? []).map((r) => ({
    ...r,
    nickname: 'nickname' in r ? r.nickname : null,
    tag_keys: 'tag_keys' in r ? r.tag_keys ?? null : null,
  }))
  return rows as CommentRow[]
}

async function fetchComments(retry = true) {
  const academyId = props.academyId
  if (!academyId) {
    comments.value = []
    return
  }
  loading.value = true
  try {
    comments.value = await doFetch(academyId)
  } catch (e) {
    console.error('Comments fetch failed:', e)
    const msg = String((e as { message?: string }).message ?? '')
    const needFallback =
      (e as { code?: string }).code === '42703' || /nickname|tag_keys|column/i.test(msg)
    if (needFallback) {
      try {
        comments.value = await doFetch(academyId, false)
      } catch {
        comments.value = []
      }
    } else if (retry) {
      await new Promise((r) => setTimeout(r, 400))
      if (props.academyId === academyId) {
        try {
          comments.value = await doFetch(academyId)
        } catch (e2) {
          console.error('Comments retry failed:', e2)
          comments.value = []
        }
      } else {
        comments.value = []
      }
    } else {
      comments.value = []
    }
  } finally {
    loading.value = false
  }
}

function startEdit(c: CommentRow) {
  editingId.value = c.id
  editingContent.value = c.content
}

function cancelEdit() {
  editingId.value = null
  editingContent.value = ''
}

async function saveEdit(commentId: string) {
  const text = editingContent.value.trim()
  if (!text) return
  updating.value = true
  try {
    const { error } = await supabase.from('comments').update({ content: text }).eq('id', commentId)
    if (error) throw error
    await fetchComments()
    editingId.value = null
    editingContent.value = ''
  } catch (e) {
    console.error('Comment update failed:', e)
    alert(e instanceof Error ? e.message : '수정에 실패했습니다.')
  } finally {
    updating.value = false
  }
}

async function removeComment(c: CommentRow) {
  if (!confirm('이 리뷰을 삭제할까요?')) return
  try {
    const { error } = await supabase.from('comments').delete().eq('id', c.id)
    if (error) throw error
    await fetchComments()
  } catch (e) {
    console.error('Comment delete failed:', e)
    alert(e instanceof Error ? e.message : '삭제에 실패했습니다.')
  }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

watch(
  () => props.academyId,
  (id) => {
    if (id) fetchComments()
    else comments.value = []
  },
  { immediate: true }
)

watch(
  () => auth.user?.id ?? null,
  () => {
    if (props.academyId) fetchComments(false)
  }
)

defineExpose({
  refetch: () => fetchComments(true),
})
</script>

<style lang="scss" scoped>
.comment-list {
  margin-top: v.$space-xl;
  padding-top: v.$space-lg;
  border-top: 1px solid v.$color-border-dim;
}

.comment-list-title {
  margin: 0 0 v.$space-md;
}

.comment-list-loading,
.comment-list-empty {
  margin: 0;
}

.comment-list-ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment-item {
  padding: v.$space-md 0;
  border-bottom: 1px solid v.$color-border-dim;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-content {
  margin: 0 0 v.$space-xs;
}

.comment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-sm;
  margin-bottom: v.$space-sm;
}

.comment-tag-chip {
  display: inline-block;
  padding: v.$space-xs v.$space-md;
  border-radius: v.$radius-full;
  background: v.$color-primary-dimmer;
}

.comment-tag-chip-negative {
  background: v.$color-accent-negative-chip-bg;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
  flex-wrap: wrap;
}

.comment-user-id {
  font-family: ui-monospace, monospace;
}

.comment-actions {
  margin-left: auto;
}

.comment-link {
  margin-left: v.$space-sm;
  padding: 0;
  border: none;
  background: none;
  @include v.link-base;
  cursor: pointer;
}

.comment-edit-input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: v.$space-sm;
  resize: vertical;
  @include v.input-base;
}

.comment-edit-actions {
  display: flex;
  gap: v.$space-sm;
}

.comment-btn {
  @include v.button-outline;
}

.comment-btn-primary {
  @include v.button-primary;
}
</style>
