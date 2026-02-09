<template>
  <div class="map-category-bar">
    <div class="map-category-row">
      <label for="map-search" class="map-category-label type-size-sm type-weight-semibold color-dim">검색</label>
      <MapSearch
        :academies="academies"
        :loading="loading"
        @select="$emit('select', $event)"
        @clear-search="$emit('clearSearch')"
      />
    </div>
    <div v-if="ageGroupOptions.length" class="map-category-row">
      <p class="map-category-label type-size-sm type-weight-semibold color-dim">대상 나이</p>
      <div class="map-category-chips">
        <button
          v-for="opt in ageGroupOptions"
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
    <div v-if="subjectOptions.length" class="map-category-row">
      <p class="map-category-label type-size-sm type-weight-semibold color-dim">과목</p>
      <div class="map-category-chips">
        <button
          v-for="opt in subjectOptions"
          :key="'sub-' + opt"
          type="button"
          class="chip chip-with-icon"
          :class="{ 'chip-active': selectedSubjects.includes(opt) }"
          @click="$emit('toggleSubject', opt)"
        >
          <Icon class="map-category-chip-icon" :path="getSubjectIcon(opt)" color="currentColor" />
          <span>{{ opt }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Academy } from '@/types/academy'
import MapSearch from '@/components/mappage/MapSearch.vue'
import Icon from '@/components/Icon.vue'
import { AGE_GROUP_ORDER, SUBJECT_LIST, isValidAgeGroup, getCanonicalSubjects, getSubjectIcon, type Subject } from '@/constants/subjectTypes'

const props = defineProps<{
  academies: Academy[]
  loading: boolean
  selectedAgeGroups: string[]
  selectedSubjects: string[]
}>()

defineEmits<{
  toggleAgeGroup: [opt: string]
  toggleSubject: [opt: string]
  select: [academy: Academy]
  clearSearch: []
}>()


const ageGroupOptions = computed(() => {
  const set = new Set<string>()
  props.academies.forEach((a) => {
    (a.age_group ?? []).forEach((g) => {
      if (isValidAgeGroup(g)) {
        set.add(g)
      }
    })
  })
  return Array.from(set).sort((a, b) => {
    const i = AGE_GROUP_ORDER.indexOf(a as typeof AGE_GROUP_ORDER[number])
    const j = AGE_GROUP_ORDER.indexOf(b as typeof AGE_GROUP_ORDER[number])
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})

const subjectOptions = computed(() => {
  // 필터·지도용: DB 원본을 표준 태그로 변환하여 사용
  const canonicalSet = new Set<Subject>()
  props.academies.forEach((a) => {
    const canonicalSubjects = getCanonicalSubjects(a.subjects ?? [])
    canonicalSubjects.forEach((canonical) => canonicalSet.add(canonical))
  })
  // SUBJECT_LIST 순서로 정렬 (표준 순서 유지)
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
@use '@/assets/styles/index' as v;

.map-category-bar {
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

.map-category-row {
  display: flex;
  align-items: center;
  gap: v.$space-md;
  min-width: 0;
}

.map-category-label {
  flex-shrink: 0;
  min-width: 4.5rem;
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

  .chip-with-icon {
    display: inline-flex;
    align-items: center;
    gap: v.$space-2xs;
    /* 모바일에서 버튼 기본 색상(파란색)이 적용되지 않도록 */
    color: inherit;
  }

  .map-category-chip-icon {
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    opacity: 0.9;
  }
}
</style>
