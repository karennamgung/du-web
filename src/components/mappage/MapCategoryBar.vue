<template>
  <div ref="barRef" class="map-category-bar">
    <!-- 검색 바 + 자동완성(검색 바 바로 밑 floating) -->
    <div class="map-search-bar-wrap">
      <!-- 검색 확장 시: 프로필·장소 없이 전체가 검색 인풋 -->
      <div class="map-search-bar">
        <template v-if="!isSearchExpanded">
          <button
            type="button"
            class="map-search-segment map-search-segment--fixed map-search-segment--fixed-profile"
            aria-label="프로필 선택"
            @click="profile.showProfileModal = true"
          >
            <div class="map-search-segment-inner">
              <span class="type-size-2xs type-weight-semibold color-dim"
                >프로필</span
              >
              <span class="map-search-segment-value-text type-weight-semibold"
                >{{ profileSegmentValue }}
              </span>
            </div>
          </button>
          <div class="map-search-segment-divider" aria-hidden="true" />
          <button
            type="button"
            class="map-search-segment map-search-segment--fixed map-search-segment--fixed-location"
            aria-haspopup="dialog"
            aria-label="동네 찾기"
            @click="openLocationModal"
          >
            <div class="map-search-segment-inner">
              <span class="type-size-2xs type-weight-semibold color-dim"
                >장소</span
              >
              <span
                v-if="myNeighborhood.loading"
                class="type-size-sm type-weight-semibold color-dim"
                >가져오는 중…</span
              >
              <span
                v-else-if="locationSummaryData"
                class="map-search-segment-value map-search-segment-value--location"
              >
                <span
                  class="map-search-segment-value-text type-weight-semibold"
                  >{{ locationSummaryData.name }}</span
                >
                <span
                  v-if="locationSummaryData.extra"
                  class="type-size-2xs type-weight-semibold color-dim"
                  >{{ locationSummaryData.extra }}</span
                >
                <Icon
                  class="map-search-segment-chevron icon-xs"
                  :path="mdiChevronDown"
                />
              </span>
              <span
                v-else
                class="map-search-segment-value-text type-weight-semibold"
                >동네 찾기</span
              >
            </div>
          </button>
          <div class="map-search-segment-divider" aria-hidden="true" />
        </template>
        <div
          class="map-search-search-input-wrap"
          :class="{
            'map-search-segment-active':
              (isSearchFocused || isSearchExpanded) && searchQuery.trim(),
            'map-search-search-input-wrap--full': isSearchExpanded,
          }"
        >
          <Transition name="search-expand" mode="out-in">
            <div
              v-if="!isSearchExpanded"
              key="normal"
              class="map-search-input-area map-search-trigger"
              role="button"
              tabindex="0"
              aria-label="검색하기"
              @click="expandSearch"
              @keydown.enter.prevent="expandSearch"
              @keydown.space.prevent="expandSearch"
            >
              <span class="type-size-2xs type-weight-semibold color-dim"
                >검색</span
              >
              <p class="map-search-query-text type-weight-semibold">
                {{ searchQuery || "학원명" }}
              </p>
            </div>
            <div
              v-else
              key="expanded"
              class="map-search-input-area map-search-input-area--expanded"
            >
              <input
                ref="expandedSearchInputRef"
                v-model="searchQuery"
                type="search"
                class="map-search-input type-weight-semibold"
                placeholder="학원명"
                autocomplete="off"
                aria-label="학원 검색"
                @focus="isSearchFocused = true"
                @blur="onSearchBlur"
              />
              <button
                type="button"
                class="btn btn-icon-only"
                aria-label="검색 닫기"
                @mousedown.prevent="collapseSearch"
              >
                <Icon class="icon-2xs" :path="mdiClose" />
              </button>
            </div>
          </Transition>
          <button
            type="button"
            class="btn btn-primary btn-rounded btn-large"
            aria-label="검색"
            @mousedown.prevent="expandedSearchInputRef?.focus()"
            @click="expandSearch"
          >
            <Icon class="map-search-circle-icon" :path="mdiMagnify" />
          </button>
        </div>
      </div>

      <!-- 자동완성: 검색 바 바로 밑에 floating -->
      <Transition name="dropdown">
        <div
          v-if="(isSearchFocused || isSearchExpanded) && searchQuery.trim()"
          class="map-search-suggestions-dropdown"
          role="listbox"
          aria-label=" 결과"
        >
          <template v-if="searchSuggestions.length">
            <div
              v-if="locationSummaryData"
              class="map-search-suggestions-header type-size-2xs type-weight-semibold color-dim"
            >
              <span>{{ locationSummaryData.name }}</span>
              <span v-if="locationSummaryData.extra">{{ locationSummaryData.extra }}</span>
              <span>지역 내 학원 리스트</span>
            </div>
            <button
              v-for="academy in searchSuggestions"
              :key="academy.id"
              type="button"
              class="map-search-suggestion"
              role="option"
              @mousedown.prevent="selectSuggestion(academy)"
            >
              <p class="type-weight-semibold">{{ academy.name }}</p>
              <p
                v-if="academy.address || academy.address_road"
                class="type-size-xs color-dim"
              >
                <template v-if="academy.address">{{
                  academy.address
                }}</template>
                <template v-if="academy.address && academy.address_road">
                  ·
                </template>
                <template v-if="academy.address_road">{{
                  academy.address_road
                }}</template>
              </p>
            </button>
          </template>
          <p v-else class="p-md color-dim">결과가 없습니다.</p>
        </div>
      </Transition>
    </div>

    <!-- 과목: 별도 컴포넌트 + 뷰포트 전체 너비(헤더 max-width 영향 안 받음) -->
    <div class="map-category-subjects-breakout">
      <MapCategorySubjects
        :subject-options="subjectOptions"
        :selected-subjects="selectedSubjects"
        @toggle-subject="(opt) => emit('toggleSubject', opt)"
        @select-all-subjects="(subjects) => emit('selectAllSubjects', subjects)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import type { Academy } from "@/types/academy";
import MapCategorySubjects from "@/components/mappage/MapCategorySubjects.vue";
import Icon from "@/components/shared/Icon.vue";
import { mdiMagnify, mdiChevronDown, mdiClose } from "@mdi/js";
import { useMyNeighborhoodStore } from "@/stores/myNeighborhood";
import { useProfileStore } from "@/stores/profile";
import {
  SUBJECT_LIST,
  getCanonicalSubjects,
  type Subject,
} from "@/constants/subjectTypes";

const props = defineProps<{
  academies: Academy[];
  /** 자동완성에 쓸 학원 목록. 없으면 academies 사용. 선택된 장소 내 학원만 넘기면 자동완성은 그 안에서만 검색 */
  academiesForSearch?: Academy[];
  loading: boolean;
  selectedSubjects: string[];
}>();

const emit = defineEmits<{
  toggleSubject: [opt: string];
  selectAllSubjects: [subjects: string[]];
  select: [academy: Academy];
  clearSearch: [];
}>();

const myNeighborhood = useMyNeighborhoodStore();
const profile = useProfileStore();
const barRef = ref<HTMLElement | null>(null);
const expandedSearchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");
const isSearchFocused = ref(false);
const isSearchExpanded = ref(false);

watch(searchQuery, (q) => {
  if (!q?.trim()) emit("clearSearch");
});

function openLocationModal() {
  myNeighborhood.showLocationSelectModal = true;
}

function expandSearch() {
  isSearchExpanded.value = true;
  isSearchFocused.value = true;
  nextTick(() => {
    expandedSearchInputRef.value?.focus();
  });
}

function collapseSearch() {
  isSearchExpanded.value = false;
  isSearchFocused.value = false;
}

function onSearchBlur() {
  // mousedown on suggestion 시 먼저 selectSuggestion 실행되도록 지연
  setTimeout(() => {
    isSearchFocused.value = false;
    isSearchExpanded.value = false;
  }, 150);
}

function selectSuggestion(academy: Academy) {
  searchQuery.value = academy.name;
  isSearchFocused.value = false;
  isSearchExpanded.value = false;
  emit("select", academy);
}

function onDocumentClick(e: MouseEvent) {
  if (barRef.value && !barRef.value.contains(e.target as Node)) {
    isSearchFocused.value = false;
    isSearchExpanded.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});

/** 프로필 세그먼트에 표시할 값: 학부모/학생이면 이름, 아니면 '프로필 선택' */
const profileSegmentValue = computed(() => {
  const p = profile.profile;
  if (p && (p.user_type === "parent" || p.user_type === "student"))
    return profile.displayName;
  return "프로필 선택";
});

const addrKey = (a: { sido: string; gugun: string; dong?: string }) =>
  `${a.sido}|${a.gugun}|${a.dong ?? ""}`;

/** 헤더와 동일: 동네 요약 (이름 + optional "+ N") */
const locationSummaryData = computed(() => {
  const list = myNeighborhood.selectedAddresses;
  const my = myNeighborhood.myLocationAddress;
  const others = my ? list.filter((a) => addrKey(a) !== addrKey(my)) : list;

  if (my) {
    const name = my.dong ?? my.gugun;
    if (others.length === 0) return { name, extra: null };
    return { name, extra: `+${others.length}` };
  }
  if (list.length === 0) return null;
  const first = list[0];
  const firstName = first.dong ?? first.gugun;
  if (list.length === 1) return { name: firstName, extra: null };
  return { name: firstName, extra: `+${list.length - 1}` };
});

const subjectOptions = computed(() => {
  const canonicalSet = new Set<Subject>();
  props.academies.forEach((a) => {
    getCanonicalSubjects(a.subjects ?? []).forEach((c) => canonicalSet.add(c));
  });
  return Array.from(canonicalSet).sort((a, b) => {
    const i = SUBJECT_LIST.indexOf(a);
    const j = SUBJECT_LIST.indexOf(b);
    if (i !== -1 && j !== -1) return i - j;
    if (i !== -1) return -1;
    if (j !== -1) return 1;
    return a.localeCompare(b);
  });
});

/** 선택된 장소(또는 전체) 내 학원 중 학원명과 일치하는 목록 (자동완성용) */
const searchSuggestions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  const source = props.academiesForSearch ?? props.academies;
  return source
    .filter((a) => a.name.toLowerCase().includes(q))
    .slice(0, 8);
});
</script>

<style lang="scss" scoped>
.map-category-bar {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  background: v.$color-bg-base;
}

/* 과목 행: 헤더 .header-sub의 max-width(36rem) 밖으로 나와 뷰포트 전체 너비 사용 */
.map-category-subjects-breakout {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* 검색 바 + 자동완성 floating 기준 */
.map-search-bar-wrap {
  position: relative;
}

/* 확장 시 실제 입력 필드 (일반 모드는 div 트리거만 있어서 인풋 전용 스타일만) */
.map-search-input {
  flex: 1;
  width: 100%;
  min-width: 0;
  border: none;
  background: transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &::placeholder {
    color: v.$color-text-dim;
  }

  &:focus {
    outline: none;
  }

  /* 브라우저 기본 검색 지우기(X) 버튼 숨김 */
  &::-webkit-search-cancel-button {
    display: none;
  }
  &::-moz-search-cancel-button {
    display: none;
  }
}

.map-search-close-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  color: v.$color-text-dim;
  cursor: pointer;
  transition:
    color v.$transition-fast,
    background-color v.$transition-fast;

  &:hover {
    color: v.$color-text-base;
    background: v.$color-bg-dim;
  }
}

.map-search-close-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.map-search-bar {
  display: flex;
  align-items: stretch;
  min-height: 3.25rem;
  border: 1px solid v.$color-border-dim;

  background: v.$color-bg-dim;
  border-radius: v.$radius-full;
  overflow: hidden;
}

.map-search-segment {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: v.$space-2xs;
  padding: v.$space-sm v.$space-md;
  border: none;
  background: v.$color-bg-base;
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: background-color v.$transition-fast;

  &:first-child {
    border-radius: v.$radius-full 0 0 v.$radius-full;
  }

  &:hover {
    background: v.$color-bg-dimmer;
  }

  &.map-search-segment-active {
    background: v.$color-bg-dim;
  }

  &.map-search-segment--fixed {
    min-width: 0; /* 버튼 기본 min-width 무시 */
    overflow: hidden;
    box-sizing: border-box;

    /* 내부 래퍼: 버튼 너비에 맞춰 잘라서 ellipsis 기준이 되게 함 */
    .map-search-segment-inner {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      gap: v.$space-2xs;
      width: 100%;
      min-width: 0;
      overflow: hidden;
    }

    /* 값 텍스트: ellipsis (프로필 이름, 장소 이름, "동네 찾기") */
    .map-search-segment-value-text {
      display: block;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* 장소 값 래퍼: flex 유지, 동 이름이 줄어들 수 있게 */
    .map-search-segment-value--location {
      min-width: 0;
      overflow: hidden;
      width: 100%;
    }
  }

  /* 프로필: 내용만큼 너비, 최대 7rem */
  &.map-search-segment--fixed-profile {
    flex: 0 1 auto;
    width: auto;
    min-width: 4rem;
    max-width: 7rem;
  }

  /* 장소: 내용만큼 너비, 최대 9rem */
  &.map-search-segment--fixed-location {
    flex: 0 1 auto;
    width: auto;
    min-width: 5rem;
    max-width: 9rem;
  }
}

.map-search-segment-divider {
  width: 1px;
  background: v.$color-border-dim;
  flex-shrink: 0;
}

/* 장소 세그먼트: 이름 + optional "+ N" + chevron (헤더 동네와 동일 스타일) */
.map-search-segment-value--location {
  display: flex;
  align-items: center;
  gap: v.$space-xs;
  min-width: 0;
  white-space: normal;

  /* 동 이름이 길 때 ellipsis (flex에서 줄어들 수 있게) */
  .map-search-segment-value-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.map-search-segment-chevron {
  flex-shrink: 0;
}

/* : 흰색 입력 영역 + 오른쪽 원형 빨간  버튼 */
.map-search-search-input-wrap {
  flex: 1;
  min-width: 8rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding-right: v.$space-2xs;
  min-height: 3.5rem;
  background: v.$color-bg-base;
  border-radius: 0 v.$radius-full v.$radius-full 0;
  overflow: hidden;

  &.map-search-segment-active {
    background: v.$color-bg-dimmer;
  }

  /* 검색 확장 시: 프로필·장소 없이 전체가 검색이라 좌측도 둥글게 */
  &.map-search-search-input-wrap--full {
    border-radius: v.$radius-full;
  }
}

.map-search-input-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: v.$space-2xs;
  padding: v.$space-sm v.$space-md;
  overflow: hidden;
}

/* 검색 영역 텍스트(비확장 시): 프로필·장소처럼 ellipsis */
.map-search-query-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.map-search-input-area--expanded {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: v.$space-xs;
}

.map-search-trigger {
  cursor: pointer;
}

.map-search-circle-btn {
  flex-shrink: 0;
  width: 3.25rem;
  min-width: 3.25rem;
  height: 3.25rem;
  min-height: 3.25rem;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: v.$color-primary;
  color: v.$color-text-inverse;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color v.$transition-fast;

  &:hover {
    background: v.$color-primary-strong;
  }
}

.map-search-circle-icon {
  width: 1.25rem;
  height: 1.25rem;
}

/* 자동완성: 검색 바 바로 밑에 floating (과목 행 위로 겹침) */
.map-search-suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: v.$space-xs;
  max-height: 20rem;
  overflow-y: auto;
  background: v.$color-bg-base;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  z-index: v.$z-dropdown;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-search-suggestions-header {
  display: flex;
  align-items: center;
  gap: v.$space-2xs;
  padding: v.$space-sm v.$space-md;
  border-bottom: 1px solid v.$color-border-dim;
}

.map-search-suggestion {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: v.$space-md;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  border-bottom: 1px solid v.$color-border-dim;
  transition: background-color v.$transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: v.$color-bg-hover;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity v.$transition-fast,
    transform v.$transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.search-expand-enter-active,
.search-expand-leave-active {
  transition: opacity v.$transition-base;
}

.search-expand-enter-from,
.search-expand-leave-to {
  opacity: 0;
}

.map-category-row {
  display: flex;
  align-items: center;
  gap: v.$space-xl;
  min-width: 0;
}

.map-category-row-subjects {
  margin-top: 0;
}

.map-category-label {
  flex-shrink: 0;
}
</style>
