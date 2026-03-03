import { defineStore } from 'pinia'
import { ref, type Component } from 'vue'

export interface SubHeaderEntry {
  component: Component
  props: Record<string, unknown>
  listeners: Record<string, (...args: unknown[]) => void>
}

export const useSubHeaderStore = defineStore('subHeader', () => {
  const entry = ref<SubHeaderEntry | null>(null)
  /** Header가 서브 헤더 래퍼에 바인딩하는 ref (지도 페이지에서 바텀 시트 최대 높이 계산용) */
  const wrapperRef = ref<HTMLElement | null>(null)

  function set(e: SubHeaderEntry) {
    entry.value = e
  }

  function clear() {
    entry.value = null
    wrapperRef.value = null
  }

  function setWrapperRef(el: HTMLElement | null) {
    wrapperRef.value = el
  }

  return { entry, wrapperRef, set, clear, setWrapperRef }
})
