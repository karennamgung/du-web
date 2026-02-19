<template>
  <div
    class="modal-header"
    :class="{ 'modal-header-draggable': isMobile && !isBottomSheetMaximized }"
    @touchstart="onPointerDown($event)"
    @touchmove.prevent="isMobile && !isBottomSheetMaximized && $emit('dragMove', $event)"
    @touchend="isMobile && !isBottomSheetMaximized && $emit('dragEnd')"
    @mousedown="onPointerDown($event)"
  >
    <!-- 모바일: 시각적 핸들 표시 (전체 헤더가 드래그 영역) -->
    <div v-if="isMobile && !isBottomSheetMaximized" class="modal-header-handle">
      <div class="modal-header-handle-bar" />
    </div>
    <!-- 타이틀·버튼 영역 (드래그 시 전체 헤더에서 move/end 수신) -->
    <div
      class="modal-header-content"
      @click="headerClickable && $emit('headerClick')"
      @touchmove.prevent="isMobile && !isBottomSheetMaximized && $emit('dragMove', $event)"
      @touchend="isMobile && !isBottomSheetMaximized && $emit('dragEnd')"
    >
      <div class="modal-header-title-row">
        <button
          v-if="showBackButton"
          type="button"
          class="btn btn-icon-only btn-rounded modal-header-back"
          aria-label="목록으로"
          @click.stop="$emit('closeSingleCard')"
        >
          <Icon :path="mdiChevronLeft" />
        </button>
        <h3 class="modal-header-title">{{ title }}</h3>
        <button
          v-if="showCloseButton && !isMobile"
          type="button"
          class="btn btn-icon-only btn-rounded modal-header-close"
          aria-label="닫기"
          @click.stop="$emit('close')"
        >
          <Icon :path="mdiClose" />
        </button>
      </div>
      <div v-if="showSort" class="modal-header-sort" @click.stop>
        <button
          type="button"
          class="chip"
          :class="{ 'chip-active': sortBy === 'comments' }"
          @click="$emit('update:sortBy', 'comments')"
        >
          리뷰순
        </button>
        <button
          type="button"
          class="chip"
          :class="{ 'chip-active': sortBy === 'name' }"
          @click="$emit('update:sortBy', 'name')"
        >
          이름순
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/shared/Icon.vue'
import { mdiChevronLeft, mdiClose } from '@mdi/js'

const props = withDefaults(
  defineProps<{
    /** 헤더에 표시할 제목 */
    title: string
    /** 모바일에서 바텀시트 드래그 가능 여부 */
    isMobile?: boolean
    /** 바텀시트가 최대 높이인지 (드래그 핸들 숨김) */
    isBottomSheetMaximized?: boolean
    /** 뒤로가기(목록으로) 버튼 표시 */
    showBackButton?: boolean
    /** 리뷰순/이름순 정렬 칩 표시 */
    showSort?: boolean
    /** 정렬 칩 표시 시 현재 값 */
    sortBy?: 'comments' | 'name'
    /** 헤더 영역 클릭 시 headerClick emit (토글 등) */
    headerClickable?: boolean
    /** 닫기 버튼 표시 (모달 등) */
    showCloseButton?: boolean
  }>(),
  { isMobile: false, isBottomSheetMaximized: true }
)

const emit = defineEmits<{
  dragStart: [e: MouseEvent | TouchEvent]
  dragMove: [e: MouseEvent | TouchEvent]
  dragEnd: []
  headerClick: []
  'update:sortBy': [value: 'comments' | 'name']
  closeSingleCard: []
  close: []
}>()

function onPointerDown(e: MouseEvent | TouchEvent) {
  if (!props.isMobile || props.isBottomSheetMaximized) return
  const target = (e.target as HTMLElement)
  if (target.closest?.('button, .btn, .chip')) return
  emit('dragStart', e)
}
</script>

<style lang="scss" scoped>
.modal-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding-bottom: v.$space-sm;

  &.modal-header-draggable {
    cursor: grab;
    user-select: none;
    transform: translateZ(0);

    &:active {
      cursor: grabbing;
    }
  }
}

.modal-header-handle {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: v.$space-md 0;
}

.modal-header-handle-bar {
  width: 2.5rem;
  height: 0.25rem;
  background: v.$color-border-strong;
  border-radius: v.$radius-full;
}

.modal-header-content {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: v.$space-sm;
  padding: v.$space-lg 0 v.$space-sm 0;


  @media (min-width: 768px) {
    padding: 0;
  }
}

.modal-header-title-row {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
  flex-wrap: nowrap;
  flex: 1;
  min-width: 0;
}

.modal-header-title {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.modal-header-back,
.modal-header-close {
  flex-shrink: 0;
}

.modal-header-sort {
  display: flex;
  align-items: center;
  gap: v.$space-xs;
}
</style>
