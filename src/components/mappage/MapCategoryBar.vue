<template>
  <div ref="barRef" class="map-category-bar">
    <!-- 에어비앤비 스타일 검색 바: 연령 | 장소 | 검색 -->
    <div class="map-search-bar">
      <button
        type="button"
        class="map-search-segment"
        :class="{ 'map-search-segment-active': openPanel === 'age' }"
        aria-haspopup="true"
        :aria-expanded="openPanel === 'age'"
        @click="togglePanel('age')"
      >
        <span class="map-search-segment-label">연령</span>
        <span class="map-search-segment-value color-dim">
          {{ ageSummary }}
        </span>
      </button>
      <div class="map-search-segment-divider" aria-hidden="true" />
      <button
        type="button"
        class="map-search-segment"
        aria-haspopup="dialog"
        @click="openLocationModal"
      >
        <span class="map-search-segment-label">장소</span>
        <span class="map-search-segment-value color-dim">
          {{ locationSummary }}
        </span>
      </button>
      <div class="map-search-segment-divider" aria-hidden="true" />
      <button
        type="button"
        class="map-search-segment map-search-search-btn"
        :class="{ 'map-search-segment-active': openPanel === 'search' }"
        aria-haspopup="true"
        :aria-expanded="openPanel === 'search'"
        @click="togglePanel('search')"
      >
        <Icon class="map-search-search-icon" :path="mdiMagnify" />
        <span>검색</span>
      </button>
    </div>

    <!-- 연령 드롭다운: 프로필(자녀) 선택 + 연령 칩 -->
    <Transition name="dropdown">
      <div
        v-if="openPanel === 'age'"
        v-show="openPanel === 'age'"
        class="map-search-dropdown"
        role="dialog"
        aria-label="연령 선택"
      >
        <div v-if="profile.profile?.user_type === 'parent' && profile.children.length" class="map-search-dropdown-section">
          <p class="map-search-dropdown-heading">프로필</p>
          <div class="map-search-dropdown-chips">
            <button
              type="button"
              class="chip"
              :class="{ 'chip-active': profile.selectedChildIndex === null }"
              @click="profile.selectChild(null)"
            >
              전체
            </button>
            <button
              v-for="(_, idx) in profile.children"
              :key="idx"
              type="button"
              class="chip"
              :class="{ 'chip-active': profile.selectedChildIndex === idx }"
              @click="profile.selectChild(idx)"
            >
              {{ getChildOrderLabel(idx) }}
            </button>
          </div>
        </div>
        <div class="map-search-dropdown-section">
          <p class="map-search-dropdown-heading">연령</p>
          <div class="map-search-dropdown-chips">
            <button
              v-for="opt in AGE_GROUP_ORDER"
              :key="'age-' + opt"
              type="button"
              class="chip"
              :class="{ 'chip-active': selectedAgeGroups.includes(opt) }"
              @click="$emit('toggleAgeGroup', opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 검색 드롭다운: 학원명·주소 검색 -->
    <Transition name="dropdown">
      <div
        v-if="openPanel === 'search'"
        v-show="openPanel === 'search'"
        class="map-search-dropdown map-search-dropdown-search"
        role="dialog"
        aria-label="학원 검색"
      >
        <MapSearch
          :academies="academies"
          :loading="loading"
          @select="onSearchSelect"
          @clear-search="emit('clearSearch')"
        />
      </div>
    </Transition>

    <!-- 과목: 검색 바 아래 -->
    <div v-if="subjectOptions.length" class="map-category-row map-category-row-subjects">
      <p class="map-category-label type-size-sm type-weight-semibold color-dim">과목</p>
      <div class="map-category-chips">
        <ButtonSubject
          v-for="opt in subjectOptions"
          :key="'sub-' + opt"
          :label="opt"
          :image="getSubjectImage(opt)"
          :active="selectedSubjects.includes(opt)"
          @click="$emit('toggleSubject', opt)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Academy } from '@/types/academy'
import MapSearch from '@/components/mappage/MapSearch.vue'
import ButtonSubject from '@/components/shared/ButtonSubject.vue'
import Icon from '@/components/shared/Icon.vue'
import { mdiMagnify } from '@mdi/js'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import { useProfileStore, getChildOrderLabel } from '@/stores/profile'
import { AGE_GROUP_ORDER, SUBJECT_LIST, getCanonicalSubjects, getSubjectImage, type Subject } from '@/constants/subjectTypes'

const props = defineProps<{
  academies: Academy[]
  loading: boolean
  selectedAgeGroups: string[]
  selectedSubjects: string[]
}>()

const emit = defineEmits<{
  toggleAgeGroup: [opt: string]
  toggleSubject: [opt: string]
  select: [academy: Academy]
  clearSearch: []
}>()

const myNeighborhood = useMyNeighborhoodStore()
const profile = useProfileStore()
const barRef = ref<HTMLElement | null>(null)
const openPanel = ref<'age' | 'search' | null>(null)

function togglePanel(panel: 'age' | 'search') {
  const willOpen = openPanel.value !== panel
  openPanel.value = openPanel.value === panel ? null : panel
  if (panel === 'age' && willOpen) {
    profile.showProfileModal = true
  }
}

function openLocationModal() {
  openPanel.value = null
  myNeighborhood.showLocationSelectModal = true
}

function onSearchSelect(academy: Academy) {
  openPanel.value = null
  emit('select', academy)
}

function onDocumentClick(e: MouseEvent) {
  if (barRef.value && !barRef.value.contains(e.target as Node)) {
    openPanel.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const ageSummary = computed(() => {
  if (!props.selectedAgeGroups.length) return '연령 선택'
  return props.selectedAgeGroups.join(', ')
})

const locationSummary = computed(() => {
  const s = myNeighborhood.selectedAddressSummary
  return s ?? '동네 찾기'
})

const subjectOptions = computed(() => {
  const canonicalSet = new Set<Subject>()
  props.academies.forEach((a) => {
    getCanonicalSubjects(a.subjects ?? []).forEach((c) => canonicalSet.add(c))
  })
  return Array.from(canonicalSet).sort((a, b) => {
    const i = SUBJECT_LIST.indexOf(a)
    const j = SUBJECT_LIST.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})
</script>

<style lang="scss" scoped>
.map-category-bar {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  padding: v.$space-md v.$space-lg;
  background: v.$color-bg-base;

  @media (min-width: 768px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.map-search-bar {
  display: flex;
  align-items: stretch;
  min-height: 3.25rem;
  background: v.$color-bg-dim;
  border-radius: v.$radius-full;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.map-search-segment {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: v.$space-2xs;
  padding: v.$space-sm v.$space-md;
  border: none;
  background: v.$color-bg-base;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background-color v.$transition-fast;

  &:first-child {
    border-radius: v.$radius-full 0 0 v.$radius-full;
  }

  &:hover {
    background: v.$color-bg-dimmer;
  }

  &.map-search-segment-active {
    background: v.$color-bg-dim;
  }
}

.map-search-segment-divider {
  width: 1px;
  background: v.$color-border-dim;
  flex-shrink: 0;
}

.map-search-segment-label {
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1.2;
  color: v.$color-text-dim;
}

.map-search-segment-value {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.map-search-search-btn {
  flex: 0 1 auto;
  min-width: 4rem;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: v.$space-xs;
  background: v.$color-primary;
  color: v.$color-text-inverse;
  border-radius: 0 v.$radius-full v.$radius-full 0;

  &:hover {
    background: v.$color-primary-strong;
  }

  &.map-search-segment-active {
    background: v.$color-primary-strong;
  }
}

.map-search-search-icon {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
}

.map-search-dropdown {
  position: absolute;
  top: 100%;
  left: v.$space-lg;
  right: v.$space-lg;
  margin-top: v.$space-xs;
  padding: v.$space-md;
  max-height: 20rem;
  overflow-y: auto;
  background: v.$color-bg-base;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  z-index: v.$z-dropdown;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    left: 2rem;
    right: 2rem;
  }
}

.map-search-dropdown-search {
  padding: v.$space-sm;
}

.map-search-dropdown-section {
  margin-bottom: v.$space-md;

  &:last-child {
    margin-bottom: 0;
  }
}

.map-search-dropdown-heading {
  margin: 0 0 v.$space-xs;
  font-size: 0.75rem;
  font-weight: 600;
  color: v.$color-text-dim;
}

.map-search-dropdown-chips {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-xs;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity v.$transition-fast, transform v.$transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.map-category-row {
  display: flex;
  align-items: center;
  gap: v.$space-xl;
  min-width: 0;
}

.map-category-row-subjects {
  margin-top: 0;
}

.map-category-label {
  flex-shrink: 0;
}

.map-category-chips {
  display: flex;
  align-items: center;
  gap: v.$space-xs;
  flex-wrap: nowrap;
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;

  .chip {
    flex-shrink: 0;
  }
}
</style>
