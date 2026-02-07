<template>
  <svg
    :class="iconClass"
    :width="computedSize"
    :height="computedSize"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path :d="path" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** MDI 아이콘 경로 (예: @mdi/js에서 import한 아이콘) */
    path: string
    /** 아이콘 크기 (기본: '1em', 또는 숫자로 픽셀 값) */
    size?: string | number
    /** 아이콘 색상 (기본: 'currentColor') */
    color?: string
    /** 추가 CSS 클래스 */
    class?: string
  }>(),
  {
    size: '1em',
    color: 'currentColor',
    class: '',
  }
)

const computedSize = computed(() => {
  if (typeof props.size === 'number') {
    return `${props.size}px`
  }
  return props.size
})

const iconClass = computed(() => {
  return ['icon-base', props.class].filter(Boolean).join(' ')
})
</script>
