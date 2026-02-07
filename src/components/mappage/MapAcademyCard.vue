<template>
  <div
    :data-academy-id="academy.id"
    role="button"
    tabindex="0"
    class="map-academy-card"
    :class="{
      'map-academy-card-active': isActive,
      'map-academy-card-search-highlight': isSearchHighlight
    }"
    @click="$emit('click', academy)"
    @keydown.enter="$emit('click', academy)"
    @keydown.space.prevent="$emit('click', academy)"
    @mouseenter="$emit('mouseenter', academy)"
    @mouseleave="$emit('mouseleave')"
  >
    <div class="map-academy-card-thumb-wrap">
      <img
        v-if="academy.image_url"
        :src="academy.image_url"
        :alt="academy.name"
        class="map-academy-card-thumb"
      />
      <div v-else class="map-academy-card-thumb map-academy-card-thumb-placeholder"></div>
      <div class="map-academy-card-thumb-actions">
        <button
          type="button"
          class="btn btn-icon-only btn-rounded"
          :class="{ 'map-academy-card-favorite-active': isFavorited }"
          :aria-label="isFavorited ? '즐겨찾기 해제' : '즐겨찾기'"
          :disabled="favoriteLoading"
          @click.stop="$emit('favoriteClick', academy.id)"
        >
          <Icon :path="isFavorited ? mdiHeart : mdiHeartOutline" />
        </button>
      </div>
    </div>
    <div class="map-academy-card-body">
      <div class="map-academy-card-head">
        <h4 class="map-academy-card-name">{{ academy.name }}</h4>
      </div>
      <p v-if="academy.address || academy.address_road" class="map-academy-card-address type-size-sm type-weight-medium color-dim type-leading-normal">
        <template v-if="academy.address">지번 {{ academy.address }}</template>
        <template v-if="academy.address && academy.address_road"> · </template>
        <template v-if="academy.address_road">도로명 {{ academy.address_road }}</template>
      </p>
      <div class="map-academy-card-meta">
        <template v-if="distanceInfo">
          <p class="type-size-sm type-weight-medium">
            {{ distanceInfo.distance }}
          </p>
          <span class="map-academy-card-meta-divider color-dimmer">·</span>
          <p class="type-size-sm type-weight-medium">
            <template v-if="distanceInfo.walkingTime < 15">
              도보 {{ distanceInfo.walkingTime }}분
            </template>
            <template v-else>
              차량 {{ distanceInfo.drivingTime }}분
            </template>
          </p>
          <span class="map-academy-card-meta-divider color-dimmer">·</span>
        </template>
        <p class="type-size-sm type-weight-medium">리뷰 {{ commentCount }}</p>
        <span class="map-academy-card-meta-divider color-dimmer">·</span>
        <p class="type-size-sm type-weight-medium">추천 {{ positiveCount }}</p>
      </div>
      <div v-if="(displayedSubjects.length || displayedAgeGroups.length)" class="map-academy-card-tags">
        <TagChip v-for="s in displayedSubjects" :key="'s-' + s" :label="s" type="subject" size="small" />
        <TagChip v-for="a in displayedAgeGroups" :key="'a-' + a" :label="a" type="age" size="small" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import TagChip from '@/components/TagChip.vue'
import { mdiHeart, mdiHeartOutline, mdiArrowLeftRight, mdiCar, mdiWalk } from '@mdi/js'
import type { Academy } from '@/types/academy'
import { isValidSubject, isValidAgeGroup, AGE_GROUP_ORDER } from '@/constants/subjectTypes'

const props = defineProps<{
  academy: Academy
  isActive: boolean
  isSearchHighlight: boolean
  isFavorited: boolean
  favoriteLoading: boolean
  commentCount: number
  positiveCount: number
  /** 현재 위치에서의 거리 및 소요 시간 정보 */
  distanceInfo: { distance: string; drivingTime: number; walkingTime: number } | null
}>()

defineEmits<{
  click: [academy: Academy]
  favoriteClick: [academyId: string]
  mouseenter: [academy: Academy]
  mouseleave: []
}>()

/** 유효한 과목만 필터링하여 표시 */
const displayedSubjects = computed(() => {
  return (props.academy.subjects ?? [])
    .filter(isValidSubject)
    .sort()
})

/** 유효한 연령 그룹만 필터링하고 표준 순서로 정렬하여 표시 */
const displayedAgeGroups = computed(() => {
  const validGroups = (props.academy.age_group ?? []).filter(isValidAgeGroup)
  return validGroups.sort((a, b) => {
    const i = AGE_GROUP_ORDER.indexOf(a)
    const j = AGE_GROUP_ORDER.indexOf(b)
    if (i !== -1 && j !== -1) return i - j
    if (i !== -1) return -1
    if (j !== -1) return 1
    return a.localeCompare(b)
  })
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;
@use '@/assets/styles/abstracts/primitives/typography' as t;
@use '@/assets/styles/abstracts/primitives/effects' as e;

.map-academy-card {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: v.$space-lg;
  border-radius: v.$radius-lg;
  background: v.$color-bg-base;
  cursor: pointer;
  text-align: left;
  font: inherit;
  outline: none;

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: none;
  }
}

.map-academy-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.map-academy-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: v.$space-sm;
}

.map-academy-card-favorite-active {
  color: v.$color-accent-favorite;
}

.map-academy-card-thumb-wrap {
  position: relative;
  flex-shrink: 0;
  width: 9rem;
  height: 9rem;
  overflow: hidden;
  border-radius: v.$radius-lg;
}

.map-academy-card-thumb-actions {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  display: flex;
  align-items: center;
  gap: v.$space-xs;
  padding: v.$space-xs;
}

.map-academy-card-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: v.$radius-lg;
  background: v.$color-bg-dimmer;
  transition: transform e.$transition-base;
  transform: scale(1);
  
  &.map-academy-card-thumb-placeholder {
    background: v.$color-bg-dimmer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &::after {
      content: '';
      width: 3rem;
      height: 3rem;
      background: v.$color-border-dim;
      border-radius: v.$radius-md;
      opacity: 0.5;
    }
  }
}

.map-academy-card:hover .map-academy-card-thumb,
.map-academy-card-active .map-academy-card-thumb {
  transform: scale(1.2);
}

.map-academy-card-name {
  display: block;
  min-width: 0;
  margin-bottom: v.$space-sm;
}

.map-academy-card-address {
  display: block;
  margin-bottom: v.$space-xs;
}

.map-academy-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: v.$space-xs;
  margin-bottom: v.$space-md;
  
  p {
    display: inline-flex;
    align-items: center;
    gap: v.$space-2xs;
  }
}

.map-academy-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: v.$space-xs;
  margin-bottom: v.$space-md;
}

.map-academy-card-meta-divider {
  user-select: none;
}

.map-academy-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-xs;
}
</style>
