<template>
  <aside 
    ref="bottomSheetRef"
    class="map-academy-list"
    :class="{ 
      'map-academy-list-minimized': isMobile && bottomSheetHeight <= MIN_HEIGHT && !singleCardAcademy
    }"
    :style="isMobile ? { height: `${bottomSheetHeight}px` } : {}"
  >
    <ModalHeader
      :title="modalHeaderTitle"
      :is-mobile="isMobile"
      :is-bottom-sheet-maximized="isBottomSheetMaximized"
      :show-back-button="!!singleCardAcademy"
      :show-sort="!singleCardAcademy"
      :sort-by="sortBy"
      :header-clickable="isMobile && !singleCardAcademy"
      @drag-start="$emit('dragStart', $event)"
      @drag-move="$emit('dragMove', $event)"
      @drag-end="$emit('dragEnd')"
      @header-click="$emit('headerClick')"
      @update:sort-by="$emit('update:sortBy', $event)"
      @close-single-card="$emit('closeSingleCard')"
    />
    <div ref="academyCardsRef" class="map-academy-cards">
      <!-- 모바일: 지도에서 선택 시 해당 학원 카드만 표시 (X 버튼으로 목록으로 복귀) -->
      <template v-if="singleCardAcademy">
        <MapAcademyCard
          :key="singleCardAcademy.id"
          :academy="singleCardAcademy"
          :is-active="true"
          :is-search-highlight="searchSelectedAcademyId === singleCardAcademy.id"
          :is-favorited="isFavorited(singleCardAcademy.id)"
          :favorite-loading="favoriteLoading"
          :comment-count="commentCountByAcademyId[singleCardAcademy.id] ?? 0"
          :distance-info="myLocation ? formatDistanceWithTime(calculateDistance(myLocation.lat, myLocation.lng, singleCardAcademy.lat, singleCardAcademy.lng)) : null"
          @click="$emit('academyClick', singleCardAcademy)"
          @favorite-click="$emit('favoriteClick', singleCardAcademy.id)"
          @mouseenter="$emit('academyMouseenter', singleCardAcademy)"
          @mouseleave="$emit('academyMouseleave')"
        />
      </template>
      <template v-else>
        <MapAcademyCard
          v-for="academy in academies"
          :key="academy.id"
          :academy="academy"
          :is-active="selectedAcademyId === academy.id"
          :is-search-highlight="searchSelectedAcademyId === academy.id"
          :is-favorited="isFavorited(academy.id)"
          :favorite-loading="favoriteLoading"
          :comment-count="commentCountByAcademyId[academy.id] ?? 0"
          :distance-info="myLocation ? formatDistanceWithTime(calculateDistance(myLocation.lat, myLocation.lng, academy.lat, academy.lng)) : null"
          @click="$emit('academyClick', academy)"
          @favorite-click="$emit('favoriteClick', academy.id)"
          @mouseenter="$emit('academyMouseenter', academy)"
          @mouseleave="$emit('academyMouseleave')"
        />
      </template>
    </div>
    <p v-if="!singleCardAcademy && !academies.length" class="map-academy-list-empty color-dim">조건에 맞는 학원이 없습니다.</p>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ModalHeader from '@/components/shared/ModalHeader.vue'
import MapAcademyCard from './MapAcademyCard.vue'
import type { Academy } from '@/types/academy'

/** 두 좌표 사이의 거리를 km 단위로 계산 (Haversine 공식) */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** 거리를 포맷팅 (0.1km 미만은 m 단위, 그 이상은 km 단위) */
function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}

/** 거리와 이동 수단에 따른 소요 시간 계산 (분 단위) */
function calculateTravelTime(distanceKm: number, mode: 'driving' | 'walking'): number {
  // 차량: 평균 시속 40km (도심 기준)
  // 보행: 평균 시속 4km
  const speedKmh = mode === 'driving' ? 40 : 4
  const timeHours = distanceKm / speedKmh
  return Math.round(timeHours * 60) // 분 단위로 변환
}

/** 거리와 소요 시간을 포맷팅 */
function formatDistanceWithTime(distanceKm: number): { distance: string; drivingTime: number; walkingTime: number } {
  return {
    distance: formatDistance(distanceKm),
    drivingTime: calculateTravelTime(distanceKm, 'driving'),
    walkingTime: calculateTravelTime(distanceKm, 'walking')
  }
}

const props = defineProps<{
  academies: Academy[]
  isMobile: boolean
  bottomSheetHeight: number
  isBottomSheetMaximized: boolean
  MIN_HEIGHT: number
  selectedAcademyId: string | null
  searchSelectedAcademyId: string | null
  sortBy: 'comments' | 'name'
  isFavorited: (id: string) => boolean
  favoriteLoading: boolean
  commentCountByAcademyId: Record<string, number>
  /** 모바일에서 지도로 학원 선택 시, 목록 대신 이 카드만 표시 (에어비엔비 스타일) */
  singleCardAcademy: Academy | null
  /** 현재 위치 (거리 계산용) */
  myLocation: { lat: number; lng: number } | null
}>()

defineEmits<{
  dragStart: [e: MouseEvent | TouchEvent]
  dragMove: [e: MouseEvent | TouchEvent]
  dragEnd: []
  headerClick: []
  'update:sortBy': [value: 'comments' | 'name']
  academyClick: [academy: Academy]
  favoriteClick: [academyId: string]
  academyMouseenter: [academy: Academy]
  academyMouseleave: []
  closeSingleCard: []
}>()

const modalHeaderTitle = computed(() =>
  props.singleCardAcademy
    ? `학원 목록 보기 (${props.academies.length}개)`
    : `학원 목록 (${props.academies.length}곳)`
)

const bottomSheetRef = ref<HTMLElement | null>(null)
const academyCardsRef = ref<HTMLElement | null>(null)

defineExpose({
  bottomSheetRef,
  academyCardsRef
})
</script>

<style lang="scss" scoped>
.map-academy-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: v.$color-bg-base;
  overflow: hidden;
  box-sizing: border-box;
  padding: 0 v.$space-lg;

  @media (min-width: 768px) {
    padding: v.$space-lg v.$space-3xl 0 v.$space-3xl;
  }

  // 모바일: 지도 위에 오버레이되는 바텀 시트 (떠 있는 느낌을 위한 그림자). translateZ(0)으로 레이어 분리해 로딩 직후에도 페인트되게 함
  @media (max-width: 767px) {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: v.$z-card;
    transform: translateZ(0);
    border-top-left-radius: v.$radius-xl;
    border-top-right-radius: v.$radius-xl;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
    transition: height v.$transition-base;
    overflow: hidden;

    &.map-academy-list-minimized {
      :deep(.modal-header-content),
      .map-academy-cards {
        opacity: 0;
        pointer-events: none;
        transition: opacity v.$transition-base;
      }

      :deep(.modal-header-handle) {
        opacity: 1;
      }
    }
  }
  
  @media (min-width: 768px) and (max-width: 1023px) {
    flex: 0 0 66.666%;
    min-width: 0;
  }

  @media (min-width: 1024px) {
    flex: 0 0 60%;
    min-width: 0;
  }
}

.map-academy-cards {
  flex: 1;
  min-height: 0;
  min-width: 0;
  margin: 0;

  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: v.$space-xl;
  padding-bottom: v.$space-lg;

  /* 태블릿: 2열 그리드 */
  @media (min-width: 768px) and (max-width: 1023px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: min-content;
    gap: v.$space-lg;
    padding-bottom: v.$space-3xl;
    align-content: start;
    align-items: start;
  }

  /* 데스크톱: 3열 그리드 */
  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: min-content;
    gap: v.$space-lg;
    padding-bottom: v.$space-3xl;
    align-content: start;
    align-items: start;
  }
}

.map-academy-list-empty {
  margin: 0;
  padding: v.$space-lg;
}
</style>
