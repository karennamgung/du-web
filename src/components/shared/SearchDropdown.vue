<template>
  <div
    ref="rootRef"
    class="search-dropdown"
    :class="{
      'search-dropdown--floating': !isMobile,
      'search-dropdown--floating-mobile': isMobile,
    }"
    :style="dropdownMaxHeightStyle"
    :role="ariaRole"
    :aria-label="ariaLabel"
  >
    <!-- 모바일: 상단 제목 + 검색 영역 (플로팅 카드 내부) -->
    <template v-if="isMobile">
      <h2 v-if="mobileTitle" class="search-dropdown-mobile-title type-weight-bold">
        {{ mobileTitle }}
      </h2>
      <div v-if="showSearchInput" class="search-dropdown-search-slot mb-md">
        <slot name="search-input" />
      </div>
    </template>

    <!-- 헤더: 사용처에서 #header 슬롯으로 넣음 -->
    <div v-if="hasHeaderSlot" class="search-dropdown-header">
      <slot name="header" />
    </div>

    <!-- 본문: 사용처에서 default 슬롯으로 넣음 -->
    <div class="search-dropdown-body">
      <slot />
    </div>

    <!-- 푸터: 사용처에서 #footer 슬롯으로 넣음 -->
    <footer v-if="hasFooterSlot" class="search-dropdown-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, useSlots, computed, nextTick } from 'vue'

const props = withDefaults(
  defineProps<{
    mobileTitle?: string
    showSearchInput?: boolean
    ariaLabel?: string
    ariaRole?: string
  }>(),
  {
    ariaLabel: '검색 결과',
    ariaRole: 'region',
  }
)

const slots = useSlots()
const hasHeaderSlot = computed(() => !!slots.header)
const hasFooterSlot = computed(() => !!slots.footer)

const isMobile = ref(false)
const rootRef = ref<HTMLElement | null>(null)
/** 내용이 넘칠 때 브라우저 바닥에서 0.5rem 위로 오도록 제한 */
const dropdownMaxHeightStyle = ref<{ maxHeight?: string }>({})

const BOTTOM_GAP_REM = 0.5
const BOTTOM_GAP_PX = BOTTOM_GAP_REM * 16

function updateMaxHeight() {
  const el = rootRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const maxHeightPx = window.innerHeight - rect.top - BOTTOM_GAP_PX
  if (maxHeightPx > 0) {
    dropdownMaxHeightStyle.value = { maxHeight: `${maxHeightPx}px` }
  } else {
    dropdownMaxHeightStyle.value = {}
  }
}

function updateIsMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  window.addEventListener('resize', updateMaxHeight)
  nextTick(updateMaxHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
  window.removeEventListener('resize', updateMaxHeight)
})
</script>

<style lang="scss" scoped>
/* 공통: 플로팅 카드 — 흰 배경, 둥근 모서리, 그림자 */
.search-dropdown {
  background: v.$color-bg-base;
  border-radius: v.$radius-lg;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid v.$color-border-dim;
  overflow: hidden;
}

/* 데스크탑/태블릿: 트리거 바로 아래 플로팅 패널, 높이는 fit-content (max-height는 JS로 뷰포트 기준 적용) */
.search-dropdown--floating {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: v.$space-2xs;
  height: fit-content;
  max-height: none; /* JS에서 인라인으로 설정 */
  overflow-y: auto;
  z-index: v.$z-modal;
}

/* default slot + footer가 있으면 본문만 스크롤, 푸터 고정 */
.search-dropdown--floating:has(.search-dropdown-footer) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-dropdown--floating:has(.search-dropdown-footer) .search-dropdown-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 모바일: 전체 너비 플로팅 카드 (max-height는 JS로 뷰포트 기준 적용) */
.search-dropdown--floating-mobile {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: auto;
  max-height: none; /* JS에서 인라인으로 설정 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: v.$z-modal;
}

.search-dropdown--floating-mobile .search-dropdown-mobile-title {
  flex-shrink: 0;
  padding: v.$space-md v.$space-md v.$space-sm;
  font-size: 1.25rem;
}

.search-dropdown--floating-mobile .search-dropdown-search-slot {
  flex-shrink: 0;
  padding: 0 v.$space-md v.$space-md;
}

.search-dropdown--floating-mobile .search-dropdown-header {
  flex-shrink: 0;
}

.search-dropdown--floating-mobile .search-dropdown-body,
.search-dropdown--floating-mobile .search-dropdown-body :deep(.search-dropdown-list) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.search-dropdown--floating-mobile .search-dropdown-footer {
  flex-shrink: 0;
}

.search-dropdown-mobile-title {
  font-size: 1.25rem;
  margin-bottom: v.$space-sm;
}

.search-dropdown-header {
  display: flex;
  align-items: center;
  gap: v.$space-2xs;
  padding: v.$space-sm v.$space-md;
  border-bottom: 1px solid v.$color-border-dim;
}

/* 사용처에서 리스트를 넣을 때 사용하는 클래스 (:deep으로 슬롯 내부 스타일) */
.search-dropdown-body :deep(.search-dropdown-list) {
  display: flex;
  flex-direction: column;
}

.search-dropdown-body :deep(.search-dropdown-item) {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: v.$space-sm v.$space-md;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  border-bottom: 1px solid v.$color-border-dim;
  transition: background-color v.$transition-fast;
}

.search-dropdown-body :deep(.search-dropdown-item:last-child) {
  border-bottom: none;
}

.search-dropdown-body :deep(.search-dropdown-item:hover) {
  background: v.$color-bg-hover;
}

.search-dropdown-body {
  min-height: 0;
  overflow-y: auto;
}

.search-dropdown-footer {
  flex-shrink: 0;
  display: flex;
  gap: v.$space-sm;
  justify-content: flex-end;
  padding: v.$space-md;
  border-top: 1px solid v.$color-border-dim;
}
</style>
