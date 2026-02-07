<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="sheet-backdrop" @click="close">
        <div class="sheet-panel" role="dialog" aria-modal="true" @click.stop>
          <div class="sheet-handle" />
          <header class="sheet-header">
            <h2 class="sheet-title ">{{ academy?.name ?? '학원 정보' }}</h2>
            <div class="sheet-header-actions">
              <button
                v-if="academy"
                type="button"
                class="btn btn-ghost btn-icon btn-rounded"
                :class="{ 'color-favorite': isFavorited(academy.id) }"
                :aria-label="isFavorited(academy.id) ? '즐겨찾기 해제' : '즐겨찾기'"
                :disabled="favoriteLoading"
                @click="onFavoriteClick"
              >
                <Icon :path="isFavorited(academy.id) ? mdiHeart : mdiHeartOutline" />
              </button>
              <button type="button" class="btn btn-ghost btn-icon btn-rounded" aria-label="닫기" @click="close">
                <Icon :path="mdiClose" />
              </button>
            </div>
          </header>
          <div v-if="academy" class="sheet-body">
            <img
              v-if="academy.image_url"
              :src="academy.image_url"
              :alt="academy.name"
              class="sheet-academy-image"
            />
            <ul class="sheet-list">
              <li class="sheet-list-item">
                <p class="sheet-list-label color-dim">학원명</p>
                <p>{{ academy.name }}</p>
              </li>
              <li class="sheet-list-item">
                <p class="sheet-list-label color-dim">지번 주소</p>
                <p>{{ academy.address || '—' }}</p>
              </li>
              <li class="sheet-list-item">
                <p class="sheet-list-label color-dim">도로명 주소</p>
                <p class="sheet-list-value">{{ academy.address_road || '—' }}</p>
              </li>
              <li class="sheet-list-item">
                <p class="sheet-list-label color-dim">과목</p>
                <p class="sheet-list-value-tags">
                  <template v-if="displayedSubjects.length">
                    <TagChip v-for="s in displayedSubjects" :key="s" :label="s" type="subject" />
                  </template>
                  <template v-else>—</template>
                </p>
              </li>
              <li class="sheet-list-item">
                <p class="sheet-list-label color-dim">대상 나이</p>
                <p class="sheet-list-value-tags">
                  <template v-if="displayedAgeGroups.length">
                    <TagChip v-for="a in displayedAgeGroups" :key="a" :label="a" type="age" />
                  </template>
                  <template v-else>—</template>
                </p>
              </li>
            </ul>
            <section v-if="academy" class="sheet-ai-analysis">
              <h3 class="sheet-ai-analysis-title ">AI 분석</h3>
              <p class="sheet-ai-analysis-desc color-dimmer type-leading-normal">
                맘까페, 네이버 리뷰, 이 플랫폼 내 리뷰과 태그 등을 종합하여 AI가 분석해준 내용입니다.
              </p>
              <div class="sheet-ai-analysis-content type-size-base type-leading-relaxed">
                {{ academyAiAnalysisText }}
              </div>
              <dl v-if="aiAnalysisKeyPoints.length" class="sheet-ai-analysis-keypoints type-size-base">
                <template v-for="item in aiAnalysisKeyPoints" :key="item.label">
                  <dt class="sheet-ai-keypoint-label type-weight-semibold color-dim">{{ item.label }}</dt>
                  <dd class="sheet-ai-keypoint-value type-leading-normal">{{ item.value }}</dd>
                </template>
              </dl>
            </section>
            <section v-if="academy" class="sheet-experience-tags">
              <h3 class="sheet-experience-title ">학원 경험 태그</h3>
              <p v-if="experienceLoading" class="sheet-experience-loading color-dim">불러오는 중...</p>
              <template v-else>
                <div class="sheet-experience-group">
                  <p class="sheet-experience-group-label color-dim">
                    추천해요
                    <small class="sheet-experience-group-count color-dimmer">({{ positiveTotalCount }})</small>
                  </p>
                  <div class="sheet-tag-list">
                    <button
                      v-for="tag in positiveExperienceTags"
                      :key="tag.tag_key"
                      type="button"
                      class="sheet-tag-chip sheet-tag-chip-positive type-size-sm color-dim"
                      :class="{ 'sheet-tag-chip-selected': experienceIsSelected(tag.tag_key) }"
                      :disabled="experienceToggling"
                      @click="onExperienceTagClick(tag.tag_key)"
                    >
                      {{ tag.label }}
                      <small v-if="tag.count > 0" class="sheet-tag-count type-size-xs">{{ tag.count }}</small>
                    </button>
                  </div>
                </div>
                <div class="sheet-experience-group">
                  <p class="sheet-experience-group-label color-dim">
                    이런점이 아쉬워요
                    <small class="sheet-experience-group-count color-dimmer">({{ negativeTotalCount }})</small>
                  </p>
                  <div class="sheet-tag-list">
                    <button
                      v-for="tag in negativeExperienceTags"
                      :key="tag.tag_key"
                      type="button"
                      class="sheet-tag-chip sheet-tag-chip-negative type-size-sm color-dim"
                      :class="{ 'sheet-tag-chip-selected': experienceIsSelected(tag.tag_key) }"
                      :disabled="experienceToggling"
                      @click="onExperienceTagClick(tag.tag_key)"
                    >
                      {{ tag.label }}
                      <small v-if="tag.count > 0" class="sheet-tag-count type-size-xs">{{ tag.count }}</small>
                    </button>
                  </div>
                </div>
              </template>
              <p v-if="!auth.isAuthenticated" class="sheet-experience-hint color-dim">로그인하면 경험 태그를 선택할 수 있어요.</p>
            </section>
            <div class="sheet-actions">
              <button type="button" class="sheet-action-btn" @click="onExperienceClick">
                경험 남기기
              </button>
            </div>
            <CommentComposer
              v-if="showComposer"
              :academy-id="academy.id"
              :selected-tag-keys="Array.from(myTagKeys)"
              @created="onCommentCreated"
            />
            <CommentList ref="commentListRef" :academy-id="academy.id" />
          </div>
          <LoginModal v-model="showLoginModal" :academy-id="academy?.id ?? null" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CommentComposer from '@/components/CommentComposer.vue'
import CommentList from '@/components/CommentList.vue'
import LoginModal from '@/components/LoginModal.vue'
import TagChip from '@/components/TagChip.vue'
import Icon from '@/components/Icon.vue'
import { EXPERIENCE_TAGS_NEGATIVE, EXPERIENCE_TAGS_POSITIVE } from '@/constants/experienceTags'
import { isValidSubject, isValidAgeGroup, AGE_GROUP_ORDER } from '@/constants/subjectTypes'
import { useAcademyExperiences } from '@/composables/useAcademyExperiences'
import { useFavorites } from '@/composables/useFavorites'
import { useAuthStore } from '@/stores/auth'
import type { Academy } from '@/types/academy'
import { computed, ref, watch } from 'vue'
import { mdiClose, mdiHeart, mdiHeartOutline } from '@mdi/js'

const props = defineProps<{
  modelValue: boolean
  academy: Academy | null
  openComposerOnOpen?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  clearOpenComposer: []
}>()

const auth = useAuthStore()
const { isFavorited, toggle, loading: favoriteLoading } = useFavorites()
const academyIdRef = computed(() => props.academy?.id ?? null)

/** 유효한 과목만 필터링하여 표시 */
const displayedSubjects = computed(() => {
  if (!props.academy?.subjects) return []
  return props.academy.subjects
    .filter(isValidSubject)
    .sort()
})

/** 유효한 연령 그룹만 필터링하고 표준 순서로 정렬하여 표시 */
const displayedAgeGroups = computed(() => {
  if (!props.academy?.age_group) return []
  const validGroups = props.academy.age_group.filter(isValidAgeGroup)
  return validGroups.sort((a, b) => {
    const i = AGE_GROUP_ORDER.indexOf(a)
    const j = AGE_GROUP_ORDER.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})
const {
  tagCounts: experienceTagCounts,
  myTagKeys,
  loading: experienceLoading,
  toggling: experienceToggling,
  isSelected: experienceIsSelected,
  toggle: experienceToggle,
} = useAcademyExperiences(academyIdRef)

const positiveKeys = new Set(EXPERIENCE_TAGS_POSITIVE.map((t) => t.key))
const negativeKeys = new Set(EXPERIENCE_TAGS_NEGATIVE.map((t) => t.key))

const positiveExperienceTags = computed(() =>
  experienceTagCounts.value.filter((t) => positiveKeys.has(t.tag_key))
)
const negativeExperienceTags = computed(() =>
  experienceTagCounts.value.filter((t) => negativeKeys.has(t.tag_key))
)
const positiveTotalCount = computed(() =>
  positiveExperienceTags.value.reduce((sum, t) => sum + t.count, 0)
)
const negativeTotalCount = computed(() =>
  negativeExperienceTags.value.reduce((sum, t) => sum + t.count, 0)
)

/** AI 분석 문구: DB/API 값이 있으면 사용, 없으면 학원 정보 기반 샘플 문구 */
const academyAiAnalysisText = computed(() => {
  const a = props.academy
  if (!a) return ''
  if (a.ai_analysis?.trim()) return a.ai_analysis.trim()
  const subjects = a.subjects?.length ? a.subjects.join(', ') : '다양한 과목'
  const age = a.age_group?.length ? a.age_group.join(', ') + ' 대상' : '전 연령'
  return `${a.name}은(는) ${subjects} 위주로 운영되며 ${age}에 적합한 학원으로 분석되었습니다. 맘까페·네이버 지도 리뷰와 본 플랫폼의 리뷰·경험 태그를 종합한 결과, 시설·선생님 친절도·가격 대비 만족도에 대한 긍정적 언급이 많았습니다. 실제 이용 후기를 참고하시면 선택에 도움이 됩니다.`
})

/** AI 분석 키 포인트 */
const aiAnalysisKeyPoints = computed(() => {
  const a = props.academy
  if (!a?.subjects?.length) return []
  return [{ label: 'Key point', value: a.subjects.join(', ') }]
})

const showLoginModal = ref(false)
const showComposer = ref(false)
const commentListRef = ref<InstanceType<typeof CommentList> | null>(null)

function close() {
  emit('update:modelValue', false)
}

async function onFavoriteClick() {
  if (!props.academy) return
  if (!auth.isAuthenticated) {
    showLoginModal.value = true
    return
  }
  try {
    await toggle(props.academy.id)
  } catch (e) {
    alert(e instanceof Error ? e.message : '즐겨찾기 변경에 실패했습니다.')
  }
}

async function onExperienceTagClick(tagKey: string) {
  if (!auth.isAuthenticated) {
    showLoginModal.value = true
    return
  }
  try {
    await experienceToggle(tagKey)
  } catch (e) {
    alert(e instanceof Error ? e.message : '경험 태그 변경에 실패했습니다.')
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

watch(
  () => [props.modelValue, props.openComposerOnOpen],
  ([open, openComposer]) => {
    if (!open) {
      showComposer.value = false
      return
    }
    if (openComposer) {
      showComposer.value = true
      emit('clearOpenComposer')
    }
  }
)
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@/assets/styles/index' as v;

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: v.$overlay-sheet-backdrop;
  z-index: v.$z-modal;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.sheet-panel {
  width: 100%;
  max-width: 30rem;
  max-height: 70vh;
  background: v.$color-bg-base;
  border-radius: v.$radius-xl v.$radius-xl 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sheet-handle {
  width: 2.25rem;
  height: 4px;
  margin: v.$space-md auto;
  background: v.$color-border-strong;
  border-radius: v.$radius-sm;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 v.$space-xl v.$space-lg;
  border-bottom: 1px solid v.$color-border-dim;
}

.sheet-title {
  flex: 1;
  min-width: 0;
}

.sheet-header-actions {
  display: flex;
  align-items: center;
  gap: v.$space-xs;
  flex-shrink: 0;
}

.sheet-body {
  padding: v.$space-xl v.$space-2xl v.$space-3xl;
  overflow-y: auto;
}

.sheet-academy-image {
  width: 100%;
  height: 11.25rem;
  object-fit: cover;
  border-radius: v.$radius-lg;
  margin-bottom: v.$space-lg;
  background: v.$color-bg-dimmer;
}

.sheet-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sheet-list-item {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;
  padding: v.$space-md 0;
  border-bottom: 1px solid v.$color-border-dim;
}

.sheet-list-item:last-child {
  border-bottom: none;
}

.sheet-list-label {
  letter-spacing: 0.02em;
}

.sheet-list-value-tags {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-sm;
}

.sheet-ai-analysis {
  margin-top: v.$space-xl;
  padding-top: v.$space-lg;
  border-top: 1px solid v.$color-border-dim;
}

.sheet-ai-analysis-title {
  margin: 0 0 v.$space-sm;
}

.sheet-ai-analysis-desc {
  margin: 0 0 v.$space-md;
}

.sheet-ai-analysis-content {
  padding: v.$space-md;
  background: v.$color-bg-dim;
  border-radius: v.$radius-md;
}

.sheet-ai-analysis-keypoints {
  margin: v.$space-md 0 0;
  padding: v.$space-md;
  background: v.$color-bg-dim;
  border-radius: v.$radius-md;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: v.$space-sm v.$space-lg;
  align-items: baseline;
}

.sheet-ai-keypoint-label {
  margin: 0;
}

.sheet-ai-keypoint-value {
  margin: 0;
}

.sheet-experience-tags {
  margin-top: v.$space-xl;
  padding-top: v.$space-lg;
  border-top: 1px solid v.$color-border-dim;
}

.sheet-experience-title {
  margin: 0 0 v.$space-md;
}

.sheet-experience-group {
  margin-bottom: v.$space-md;
}

.sheet-experience-group:last-of-type {
  margin-bottom: 0;
}

.sheet-experience-group-label {
  display: block;
  margin-bottom: v.$space-sm;
}

.sheet-experience-group-count {
  margin-left: v.$space-xs;
}

.sheet-experience-hint {
  margin: 0;
  margin-top: v.$space-sm;
}

.sheet-experience-loading {
  margin: 0;
}

.sheet-tag-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
}

.sheet-tag-chip {
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

.sheet-tag-chip-positive {
  &:hover:not(:disabled) {
    border-color: v.$color-primary;
    color: v.$color-primary;
    background: v.$color-primary-dimmer;
  }
  &.sheet-tag-chip-selected {
    border-color: v.$color-primary;
    background: v.$color-primary;
    color: v.$color-text-inverse;
    &:hover:not(:disabled) {
      background: v.$color-primary-strong;
      border-color: v.$color-primary-strong;
    }
  }
}

.sheet-tag-chip-negative {
  &:hover:not(:disabled) {
    border-color: v.$color-accent-negative-chip;
    color: v.$color-accent-negative-chip;
    background: v.$color-accent-negative-chip-bg;
  }
  &.sheet-tag-chip-selected {
    border-color: v.$color-accent-negative-chip;
    background: v.$color-accent-negative-chip;
    color: v.$color-text-inverse;
    &:hover:not(:disabled) {
      background: color.adjust(v.$color-accent-negative-chip, $lightness: -8%);
      border-color: color.adjust(v.$color-accent-negative-chip, $lightness: -8%);
    }
  }
}

.sheet-tag-chip:not(.sheet-tag-chip-positive):not(.sheet-tag-chip-negative):hover:not(:disabled) {
  border-color: v.$color-primary;
  color: v.$color-primary;
  background: v.$color-primary-dimmer;
}

.sheet-tag-chip-selected:not(.sheet-tag-chip-positive):not(.sheet-tag-chip-negative) {
  border-color: v.$color-primary;
  background: v.$color-primary;
  color: v.$color-text-inverse;
  &:hover:not(:disabled) {
    background: v.$color-primary-strong;
    border-color: v.$color-primary-strong;
  }
}

.sheet-tag-count {
  opacity: 0.9;
}

.sheet-actions {
  margin-top: v.$space-lg;
}

.sheet-action-btn {
  width: 100%;
  @include v.button-outline;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity v.$transition-base;
}

.sheet-enter-active .sheet-panel,
.sheet-leave-active .sheet-panel {
  transition: transform v.$transition-slow;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .sheet-panel,
.sheet-leave-to .sheet-panel {
  transform: translateY(100%);
}
</style>
