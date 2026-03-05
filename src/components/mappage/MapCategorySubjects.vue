<template>
  <div
    v-if="subjectOptions.length"
    ref="outerRef"
    class="map-category-subjects-outer flex pb-lg pl-lg pr-lg"
    :class="{ 'justify-center': !isOverflowing, 'justify-start': isOverflowing }"
  >
    <div ref="innerRef" class="map-category-subjects flex items-center gap-lg">
      <ButtonSubject
        label="전체 과목"
        :image="allSubjectsIconUrl"
        :active="isAllSubjectsSelected"
        @click="onClickAllSubjects"
      />
      <ButtonSubject
        v-for="opt in subjectOptions"
        :key="'sub-' + opt"
        :label="opt"
        :image="getSubjectImage(opt)"
        :active="selectedSubjects.includes(opt)"
        @click="emit('toggleSubject', opt)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ButtonSubject from '@/components/shared/ButtonSubject.vue'
import { getSubjectImage } from '@/constants/subjectTypes'

const props = defineProps<{
  subjectOptions: string[]
  selectedSubjects: string[]
}>()

const emit = defineEmits<{
  toggleSubject: [opt: string]
  selectAllSubjects: [subjects: string[]]
}>()

const allSubjectsIconUrl = '/all-subjects.png'

const isAllSubjectsSelected = computed(() => {
  if (!props.subjectOptions.length) return false
  return props.subjectOptions.every((opt) => props.selectedSubjects.includes(opt))
})

const justClearedAllRef = ref(false)

function onClickAllSubjects() {
  if (isAllSubjectsSelected.value) {
    justClearedAllRef.value = true
    emit('selectAllSubjects', [])
  } else {
    emit('selectAllSubjects', [...props.subjectOptions])
  }
}

const outerRef = ref<HTMLElement | null>(null)
const innerRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)

function checkOverflow() {
  const outer = outerRef.value
  const inner = innerRef.value
  if (!outer || !inner) return
  isOverflowing.value = inner.scrollWidth > outer.clientWidth
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    checkOverflow()
    const outer = outerRef.value
    if (outer && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => checkOverflow())
      resizeObserver.observe(outer)
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.subjectOptions.length, outerRef.value, innerRef.value] as const,
  () => {
    nextTick(checkOverflow)
    const outer = outerRef.value
    if (outer && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => checkOverflow())
      resizeObserver.observe(outer)
    }
  },
  { flush: 'post' }
)

// 전체 비선택 시 자동으로 전체 과목 선택 (단, "전체 과목" 클릭으로 해제한 경우는 제외)
watch(
  () => props.selectedSubjects.length,
  (len, prevLen) => {
    if (len === 0 && props.subjectOptions.length > 0 && prevLen !== undefined) {
      if (justClearedAllRef.value) {
        justClearedAllRef.value = false
        return
      }
      emit('selectAllSubjects', [...props.subjectOptions])
    }
  }
)
</script>

<style lang="scss" scoped>
/* 바깥: 화면 가운데 정렬 + 넘치면 가로 스크롤 */
.map-category-subjects-outer {
  min-width: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* 안: 내용 너비만큼만 → 짧으면 가운데, 길면 왼쪽부터 스크롤 */
.map-category-subjects {
  width: max-content;
  flex-wrap: nowrap;

  :deep(.tab) {
    flex-shrink: 0;
  }
}
</style>
