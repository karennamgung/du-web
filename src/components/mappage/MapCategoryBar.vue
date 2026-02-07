<template>
  <div v-if="ageGroupOptions.length || subjectOptions.length" class="map-category-bar">
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
          class="chip"
          :class="{ 'chip-active': selectedSubjects.includes(opt) }"
          @click="$emit('toggleSubject', opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Academy } from '@/types/academy'
import { AGE_GROUP_ORDER, SUBJECT_LIST, isValidAgeGroup, isValidSubject } from '@/constants/subjectTypes'

const props = defineProps<{
  academies: Academy[]
  selectedAgeGroups: string[]
  selectedSubjects: string[]
}>()

defineEmits<{
  toggleAgeGroup: [opt: string]
  toggleSubject: [opt: string]
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
    const i = AGE_GROUP_ORDER.indexOf(a)
    const j = AGE_GROUP_ORDER.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})

const subjectOptions = computed(() => {
  const set = new Set<string>()
  props.academies.forEach((a) => {
    (a.subjects ?? []).forEach((s) => {
      if (isValidSubject(s)) {
        set.add(s)
      }
    })
  })
  // SUBJECT_LIST 순서로 정렬 (표준 순서 유지)
  return Array.from(set).sort((a, b) => {
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
  border-bottom: 1px solid v.$color-border-dim;
  box-shadow: v.$shadow-sm;
}

.map-category-row {
  display: flex;
  align-items: center;
  gap: v.$space-md;
  flex-wrap: wrap;
}

.map-category-label {
  flex-shrink: 0;
  min-width: 4.5rem;
}

.map-category-chips {
  display: flex;
  align-items: center;
  gap: v.$space-xs;
  flex-wrap: wrap;
}
</style>
