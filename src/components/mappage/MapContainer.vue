<template>
  <div 
    class="map-container-wrapper"
    :class="{ 'map-container-wrapper-mobile': isMobile }"
    :style="isMobile ? { bottom: `${Math.max(0, bottomSheetHeight - 16)}px` } : {}"
  >
    <div ref="mapContainerRef" class="map-container">
      <div class="map-controls">
      <button
        type="button"
        class="btn btn-gray btn-small btn-icon btn-rounded"
        title="확대"
        :disabled="!hasMap"
        @click="$emit('zoomIn')"
      >
        <Icon class="icon-xs" :path="mdiPlus" />
      </button>
      <button
        type="button"
        class="btn btn-gray btn-small btn-icon btn-rounded"
        title="축소"
        :disabled="!hasMap"
        @click="$emit('zoomOut')"
      >
        <Icon class="icon-xs" :path="mdiMinus" />
      </button>
      <button
        v-if="hasMyNeighborhood"
        type="button"
        class="btn btn-gray btn-rounded btn-small"
        title="내 위치와 학원 밀집 지역으로 이동"
        :disabled="!hasMap"
        @click="$emit('resetToDefault')"
      >
        내 동네 학원
      </button>
      <button
        type="button"
        class="btn btn-gray btn-rounded btn-small"
        title="현재 지도에 보이는 영역 안의 학원만 목록에 표시"
        :disabled="!hasMap"
        @click="$emit('searchVisibleBounds')"
      >
        현재 보이는 지역 재검색
      </button>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/shared/Icon.vue'
import { mdiPlus, mdiMinus } from '@mdi/js'

defineProps<{
  isMobile: boolean
  bottomSheetHeight: number
  hasMap: boolean
  /** 내 동네(위치)가 지정되어 있을 때만 '내 동네 학원' 버튼 표시 */
  hasMyNeighborhood: boolean
}>()

defineEmits<{
  zoomIn: []
  zoomOut: []
  resetToDefault: []
  searchVisibleBounds: []
}>()

const mapContainerRef = ref<HTMLElement | null>(null)

defineExpose({
  mapContainerRef
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.map-container-wrapper {
  position: relative;
  width: 100%;
  min-height: 12.5rem;
  
  // 모바일: 지도는 바텀 시트 뒤에만 보이도록(z-base), 컨트롤은 맨 위(z-floating)
  @media (max-width: 767px) {
    &.map-container-wrapper-mobile {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      flex: none;
      min-height: 0;
      z-index: v.$z-base;
    }
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    flex: 0 0 33.333%; /* 태블릿: 목록 66.666% + 지도 33.333% = 100% */
    min-width: 0;
    box-sizing: border-box;
    padding: v.$space-md;
    padding-right: 2rem;
  }
  
  @media (min-width: 1024px) {
    flex: 0 0 40%; /* 데스크톱: 목록 60% + 지도 40% = 100% */
    min-width: 0;
    box-sizing: border-box;
    padding: v.$space-lg;
    padding-right: 2rem;
  }
}

.map-controls {
  position: absolute;
  bottom: v.$space-lg;
  right: v.$space-lg;
  z-index: v.$z-canvas;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: v.$space-sm;
  pointer-events: none; // 컨테이너는 클릭 통과, 버튼만 클릭 가능
  
  // 모바일: 학원 목록 바텀 시트 위에 버튼이 보이도록, 1rem 위로 올림
  @media (max-width: 767px) {
    z-index: v.$z-floating;
    bottom: v.$space-2xl;
  }
  
  button {
    pointer-events: auto; // 버튼만 클릭 가능
  }
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 12.5rem;
  
  @media (min-width: 768px) {
    min-width: 0;
    border-radius: v.$radius-xl;
    overflow: hidden;
  }
}
</style>
