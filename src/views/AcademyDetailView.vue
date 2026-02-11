<template>
  <div class="academy-detail">
    <section v-if="loading" class="academy-detail-loading">
      <p>학원 정보를 불러오는 중...</p>
    </section>

    <section v-else-if="!academy" class="academy-detail-empty">
      <h1>학원 정보를 찾을 수 없어요</h1>
      <p class="color-dim mt-sm">링크가 잘못되었거나 학원 정보가 삭제되었을 수 있어요.</p>
      <router-link to="/" class="btn btn-outline mt-md">지도로 돌아가기</router-link>
    </section>

    <section v-else class="academy-detail-body">
      <header class="academy-detail-header">
        <div class="academy-detail-title-wrap">
          <h1>
            {{ academy.name }}
          </h1>
          <p v-if="academy.address || academy.address_road" class="academy-detail-address color-dim">
            <template v-if="academy.address">지번 {{ academy.address }}</template>
            <template v-if="academy.address && academy.address_road"> · </template>
            <template v-if="academy.address_road">도로명 {{ academy.address_road }}</template>
          </p>
          <div v-if="displayedSubjects.length || displayedAgeGroups.length" class="academy-detail-tags">
            <TagChip v-for="s in displayedSubjects" :key="'s-' + s" :label="s" type="subject" />
            <TagChip v-for="a in displayedAgeGroups" :key="'a-' + a" :label="a" type="age" />
          </div>
        </div>
        <div class="academy-detail-actions">
          <button
            v-if="academy"
            type="button"
            class="btn btn-ghost btn-icon btn-rounded"
            :class="{ 'academy-detail-favorite-active color-favorite': isFavorited(academy.id) }"
            :aria-label="isFavorited(academy.id) ? '즐겨찾기 해제' : '즐겨찾기'"
            :disabled="favoriteLoading"
            @click="onFavoriteClick"
          >
            <Icon :path="isFavorited(academy.id) ? mdiHeart : mdiHeartOutline" />
          </button>
        </div>
      </header>

      <div class="academy-detail-main">
        <div class="academy-detail-main-left">
          <img
            v-if="academy.image_url"
            :src="academy.image_url"
            :alt="academy.name"
            class="academy-detail-image"
          />

          <ul class="academy-detail-list">
            <li class="academy-detail-list-item">
              <p class="academy-detail-list-label color-dim">학원명</p>
              <p>{{ academy.name }}</p>
            </li>
            <li class="academy-detail-list-item">
              <p class="academy-detail-list-label color-dim">지번 주소</p>
              <p>{{ academy.address || '—' }}</p>
            </li>
            <li class="academy-detail-list-item">
              <p class="academy-detail-list-label color-dim">도로명 주소</p>
              <p>{{ academy.address_road || '—' }}</p>
            </li>
          </ul>

          <section class="academy-detail-ai">
            <h2 class="mb-sm">AI 분석</h2>
            <p class="color-dimmer type-leading-normal mb-sm">
              맘까페, 네이버 리뷰, 이 플랫폼 내 리뷰과 태그 등을 종합하여 AI가 분석해준 내용입니다.
            </p>
            <div class="academy-detail-ai-content type-size-base type-leading-relaxed">
              {{ academyAiAnalysisText }}
            </div>
            <dl v-if="aiAnalysisKeyPoints.length" class="academy-detail-ai-keypoints type-size-base">
              <template v-for="item in aiAnalysisKeyPoints" :key="item.label">
                <dt class="academy-detail-ai-keypoint-label type-weight-semibold color-dim">{{ item.label }}</dt>
                <dd class="academy-detail-ai-keypoint-value type-leading-normal">{{ item.value }}</dd>
              </template>
            </dl>
          </section>
        </div>

        <aside class="academy-detail-right">
          <section class="academy-detail-comments">
            <div class="academy-detail-comments-header">
              <h2>후기 남기기</h2>
              <button type="button" class="btn btn-outline btn-small" @click="onExperienceClick">
                경험 남기기
              </button>
            </div>
            <CommentComposer
              v-if="showComposer && academy"
              :academy-id="academy.id"
              :selected-tag-keys="[]"
              @created="onCommentCreated"
            />
            <CommentList v-if="academy" ref="commentListRef" :academy-id="academy.id" />
          </section>
        </aside>
      </div>

      <LoginModal v-model="showLoginModal" :academy-id="academy?.id ?? null" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CommentComposer from '@/components/CommentComposer.vue'
import CommentList from '@/components/CommentList.vue'
import LoginModal from '@/components/modals/LoginModal.vue'
import TagChip from '@/components/shared/TagChip.vue'
import Icon from '@/components/shared/Icon.vue'
import { getDisplaySubjects, isValidAgeGroup, AGE_GROUP_ORDER } from '@/constants/subjectTypes'
import { useFavorites } from '@/composables/useFavorites'
import { useAuthStore } from '@/stores/auth'
import type { Academy } from '@/types/academy'
import { supabase } from '@/lib/supabase'
import { mdiHeart, mdiHeartOutline } from '@mdi/js'

const route = useRoute()

const academy = ref<Academy | null>(null)

/** 상세에 표시할 과목 태그 (DB 원본, null/undefined 제외) */
const displayedSubjects = computed(() =>
  (getDisplaySubjects(academy.value?.subjects ?? []) ?? []).filter((s): s is string => s != null && s !== '')
)

/** 유효한 연령 그룹만 필터링하고 표준 순서로 정렬하여 표시 */
const displayedAgeGroups = computed(() => {
  if (!academy.value?.age_group) return []
  const validGroups = academy.value.age_group.filter((a): a is string => a != null && a !== '' && isValidAgeGroup(a))
  return validGroups.sort((a, b) => {
    const i = AGE_GROUP_ORDER.indexOf(a)
    const j = AGE_GROUP_ORDER.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})
const loading = ref(true)
const showLoginModal = ref(false)
const showComposer = ref(false)

const auth = useAuthStore()
const { isFavorited, toggle, loading: favoriteLoading } = useFavorites()

const academyAiAnalysisText = computed(() => {
  const a = academy.value
  if (!a) return ''
  if (a.ai_analysis?.trim()) return a.ai_analysis.trim()
  const subjects = a.subjects?.length ? a.subjects.join(', ') : '다양한 과목'
  const age = a.age_group?.length ? a.age_group.join(', ') + ' 대상' : '전 연령'
  return `${a.name}은(는) ${subjects} 위주로 운영되며 ${age}에 적합한 학원으로 분석되었습니다. 맘까페·네이버 지도 리뷰와 본 플랫폼의 리뷰·경험 태그를 종합한 결과, 시설·선생님 친절도·가격 대비 만족도에 대한 긍정적 언급이 많았습니다. 실제 이용 후기를 참고하시면 선택에 도움이 됩니다.`
})

const aiAnalysisKeyPoints = computed(() => {
  const a = academy.value
  if (!a?.subjects?.length) return []
  return [{ label: 'Key point', value: a.subjects.join(', ') }]
})

const commentListRef = ref<InstanceType<typeof CommentList> | null>(null)

async function fetchAcademy() {
  try {
    const id = String(route.params.id)
    const { data, error } = await supabase
      .from('academies')
      .select('id, name, address, address_road, lat, lng, subjects, age_group, image_url, ai_analysis')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      academy.value = null
      return
    }

    academy.value = {
      id: data.id,
      name: data.name,
      address: data.address ?? '',
      address_road: (data as { address_road?: string | null }).address_road ?? null,
      lat: data.lat,
      lng: data.lng,
      subjects: data.subjects ?? [],
      age_group: data.age_group ?? null,
      image_url: data.image_url ?? null,
      ai_analysis: (data as { ai_analysis?: string | null }).ai_analysis ?? null,
    }
  } catch (e) {
    console.error('Academy fetch failed:', e)
    academy.value = null
  } finally {
    loading.value = false
  }
}

async function onFavoriteClick() {
  if (!academy.value) return
  if (!auth.isAuthenticated) {
    showLoginModal.value = true
    return
  }
  try {
    await toggle(academy.value.id)
  } catch (e) {
    alert(e instanceof Error ? e.message : '즐겨찾기 변경에 실패했습니다.')
  }
}

function onExperienceClick() {
  if (!auth.isAuthenticated) {
    showLoginModal.value = true
  } else {
    showComposer.value = true
  }
}

async function onCommentCreated() {
  await commentListRef.value?.refetch()
  showComposer.value = false
}

onMounted(async () => {
  loading.value = true
  await fetchAcademy()
  // 쿼리 파라미터로 컴포저 자동 열기
  if (route.query.openComposer === 'true') {
    showComposer.value = true
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/index' as v;

.academy-detail {
  padding: v.$space-xl v.$space-lg v.$space-2xl;
  max-width: 72rem;
  margin: 0 auto;
}

.academy-detail-loading,
.academy-detail-empty {
  padding: v.$space-2xl 0;
  text-align: center;
}

.academy-detail-body {
  display: flex;
  flex-direction: column;
  gap: v.$space-xl;
}

.academy-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: v.$space-md;
  border-bottom: 1px solid v.$color-border-dim;
  padding-bottom: v.$space-md;
}

.academy-detail-title-wrap {
  flex: 1;
  min-width: 0;
}

.academy-detail-title {
  margin: 0 0 v.$space-xs;
}

.academy-detail-address {
  margin: 0 0 v.$space-sm;
}

.academy-detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-sm;
}

.academy-detail-actions {
  flex-shrink: 0;
}

.academy-detail-favorite-active {
  color: v.$color-accent-favorite;
}

.academy-detail-main {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: v.$space-xl;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.academy-detail-main-left {
  min-width: 0;
}

.academy-detail-right {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.academy-detail-image {
  width: 100%;
  height: 12.5rem;
  object-fit: cover;
  border-radius: v.$radius-lg;
  margin-bottom: v.$space-lg;
  background: v.$color-bg-dimmer;
}

.academy-detail-list {
  margin: 0 0 v.$space-xl;
  padding: 0;
  list-style: none;
}

.academy-detail-list-item {
  padding: v.$space-md 0;
  border-bottom: 1px solid v.$color-border-dim;
}

.academy-detail-list-item:last-child {
  border-bottom: none;
}

.academy-detail-list-label {
  margin-bottom: v.$space-2xs;
}

.academy-detail-ai {
  padding-top: v.$space-md;
  border-top: 1px solid v.$color-border-dim;
}

.academy-detail-ai-content {
  margin-top: v.$space-sm;
  padding: v.$space-md;
  background: v.$color-bg-dim;
  border-radius: v.$radius-md;
}

.academy-detail-ai-keypoints {
  margin: v.$space-md 0 0;
  padding: v.$space-md;
  background: v.$color-bg-dim;
  border-radius: v.$radius-md;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: v.$space-sm v.$space-lg;
  align-items: baseline;
}

.academy-detail-ai-keypoint-label {
  margin: 0;
}

.academy-detail-ai-keypoint-value {
  margin: 0;
}

.academy-detail-experience {
  padding: v.$space-md;
  border-radius: v.$radius-lg;
  border: 1px solid v.$color-border-dim;
  background: v.$color-bg-base;
}

.academy-detail-experience-group {
  margin-bottom: v.$space-md;
}

.academy-detail-experience-group:last-of-type {
  margin-bottom: 0;
}

.academy-detail-tag-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
  margin-top: v.$space-xs;
}

.academy-detail-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: v.$space-xs;
  padding: v.$space-sm v.$space-md;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-full;
  background: v.$color-bg-base;
  cursor: pointer;
  transition: border-color v.$transition-fast, background-color v.$transition-fast, color v.$transition-fast;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.academy-detail-tag-chip-selected {
  border-color: v.$color-primary;
  background: v.$color-primary;
  color: v.$color-text-inverse;

  &:hover:not(:disabled) {
    background: v.$color-primary-strong;
    border-color: v.$color-primary-strong;
  }
}

.academy-detail-tag-chip-negative.academy-detail-tag-chip-selected {
  border-color: v.$color-accent-negative-chip;
  background: v.$color-accent-negative-chip;
}

.academy-detail-tag-count {
  opacity: 0.9;
}

.academy-detail-comments {
  padding: v.$space-md;
  border-radius: v.$radius-lg;
  border: 1px solid v.$color-border-dim;
  background: v.$color-bg-base;
}

.academy-detail-comments-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: v.$space-sm;
  margin-bottom: v.$space-md;
}
</style>

