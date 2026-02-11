<template>
  <div class="map-page">
    <p v-if="loading" class="map-loading">학원 목록 불러오는 중...</p>
    <header v-else ref="categoryBarRef" class="map-page-header">
      <div class="map-page-filter-section">
        <MapCategoryBar
          :academies="academies"
          :loading="loading"
          :selected-age-groups="selectedAgeGroups"
          :selected-subjects="selectedSubjects"
          @toggle-age-group="toggleAgeGroup"
          @toggle-subject="toggleSubject"
          @select="handleSearchSelect"
          @clear-search="searchSelectedAcademyId = null"
        />
      </div>
    </header>

    <div v-if="!loading" class="map-content">
      <div class="map-content-inner">
        <MapAcademyList
          ref="academyListComponentRef"
          :academies="sortedAcademyList"
          :is-mobile="isMobile"
          :bottom-sheet-height="bottomSheetHeight"
          :is-bottom-sheet-maximized="isBottomSheetMaximized"
          :MIN_HEIGHT="MIN_HEIGHT"
          :selected-academy-id="selectedAcademy?.id ?? null"
          :search-selected-academy-id="searchSelectedAcademyId"
          :has-visible-bounds-filter="!!visibleBoundsFilter"
          :sort-by="academyListSortBy"
          :is-favorited="isFavorited"
          :favorite-loading="favoriteLoading"
          :comment-count-by-academy-id="commentCountByAcademyId"
          :single-card-academy="isMobile && selectedAcademy ? selectedAcademy : null"
          :my-location="myLocation"
          @drag-start="onDragStart"
          @drag-move="onDragMove"
          @drag-end="onDragEnd"
          @header-click="isMobile && !didDrag ? toggleBottomSheet() : null"
          @clear-visible-bounds-filter="visibleBoundsFilter = null"
          @update:sort-by="academyListSortBy = $event"
          @academy-click="openAcademy"
          @favorite-click="onCardFavoriteClick"
          @academy-mouseenter="handleAcademyMouseenter"
          @academy-mouseleave="handleAcademyMouseleave"
          @close-single-card="selectedAcademy = null"
        />
        <MapContainer
          ref="mapContainerComponentRef"
          :is-mobile="isMobile"
          :bottom-sheet-height="bottomSheetHeight"
          :has-map="mapReady"
          :has-my-neighborhood="!!(myNeighborhood.name || myNeighborhood.lastLocation)"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @search-visible-bounds="searchVisibleBounds"
          @reset-to-default="resetToDefault"
        />
      </div>
      <!-- 모바일: 학원 목록이 전체 확장됐을 때 화면 하단 중앙에 노출되는 '지도 보기' 버튼 -->
      <button
        v-if="isMobile && isBottomSheetMaximized"
        type="button"
        class="btn btn-strongest btn-small btn-rounded map-show-map-button"
        @click="toggleBottomSheet()"
      >
        <Icon :path="mdiMapOutline" class="icon-xs" />
        지도 보기
      </button>
    </div>
    <LoginModal v-model="showLoginModal" :academy-id="null" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import LoginModal from '@/components/modals/LoginModal.vue'
import Icon from '@/components/shared/Icon.vue'
import MapCategoryBar from '@/components/mappage/MapCategoryBar.vue'
import MapContainer from '@/components/mappage/MapContainer.vue'
import MapAcademyList from '@/components/mappage/MapAcademyList.vue'
import { useFavorites } from '@/composables/useFavorites'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import { supabase } from '@/lib/supabase'
import type { Academy } from '@/types/academy'
import { mdiMapMarker, mdiMapOutline, mdiCircle, mdiSquare } from '@mdi/js'
import { getSubjectIconPath, MY_LOCATION_MARKER_ICON, AGE_GROUP_ORDER, getCanonicalSubject, isValidAgeGroup, isValidSubject, getAgeGroupsFromAges } from '@/constants/subjectTypes'
import { useProfileStore } from '@/stores/profile'

const SONGDO_CENTER = { lat: 37.3833, lng: 126.6567 }
/** MDI 원 아이콘 마커: 원 중심이 좌표에 오도록 앵커 설정 */
const MARKER_ICON_SIZE = 16
const MARKER_ANCHOR_X = 0  // 원 아이콘 왼쪽 끝이 기준
const MARKER_ANCHOR_Y = MARKER_ICON_SIZE / 2  // 원 아이콘 세로 중앙

const SCRIPT_ID = 'naver-maps-sdk'
const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID ?? ''

const router = useRouter()
const profileStore = useProfileStore()
const mapContainerComponentRef = ref<InstanceType<typeof MapContainer> | null>(null)
/** 지도 인스턴스 준비 여부 — 버튼(+, -, 재검색 등) 활성화용 (map은 비반응형 변수라 ref로 노출) */
const mapReady = ref(false)
const academyListComponentRef = ref<InstanceType<typeof MapAcademyList> | null>(null)
const selectedAcademy = ref<Academy | null>(null)
const academies = ref<Academy[]>([])
const loading = ref(true)
const selectedAgeGroups = ref<string[]>([])

/** 프로필/선택된 사용자(학부모·자녀)의 나이 → 대상나이 필터에 반영할 연령 그룹 */
const profileAgeGroups = computed(() => {
  const profile = profileStore.profile
  const children = profileStore.children
  const currentChild = profileStore.currentChild
  if (!profile) return []
  if (profile.user_type === 'parent') {
    const ages = currentChild ? [currentChild.age] : children.map((c) => c.age).filter((a) => typeof a === 'number')
    return getAgeGroupsFromAges(ages)
  }
  return []
})

const selectedSubjects = ref<string[]>([])
/** 검색 드롭다운에서 선택한 학원 ID — 지도/목록에서 하이라이트·맨 위로 표시 */
const searchSelectedAcademyId = ref<string | null>(null)
const commentCountByAcademyId = ref<Record<string, number>>({})
const academyListSortBy = ref<'comments' | 'name'>('name')

// 모바일 바텀 시트 상태
const isMobile = ref(false)
const bottomSheetHeight = ref(0) // 현재 높이 (px)
const isDragging = ref(false)
const didDrag = ref(false) // 드래그로 내렸을 때 헤더 클릭(토글) 방지
const dragStartY = ref(0)
const dragStartHeight = ref(0)
// 바텀 시트 최소 높이: 드래그 영역(map-bottom-sheet-drag-area)만 보이도록 (handle padding 12px×2 + bar 4px ≈ 28px)
const MIN_HEIGHT = 28

const categoryBarRef = ref<HTMLElement | null>(null)

/** 모바일: 확장 시 최대 높이(px). 필터(대상연령/과목) 실제 하단 기준으로 꽉 차게 */
function getMaxSheetHeightPx(): number {
  if (typeof window === 'undefined') return 500
  const el = categoryBarRef.value
  const filterBottom = el ? el.getBoundingClientRect().bottom : 180 // 폴백: 앱 헤더+필터 대략
  const maxHeight = window.innerHeight - filterBottom
  return Math.max(MIN_HEIGHT, maxHeight)
}

/** 모바일: 2단계(반) 높이(px). 필터 아래 남은 공간을 반으로 나눠 지도 = 학원 목록 높이 */
function getDefaultSheetHeightPx(): number {
  return Math.max(MIN_HEIGHT, Math.floor(getMaxSheetHeightPx() / 2))
}

// 모바일 바텀 시트 드래그 핸들러
function onDragStart(e: MouseEvent | TouchEvent) {
  if (!isMobile.value) return
  isDragging.value = true
  didDrag.value = false
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragStartY.value = clientY
  dragStartHeight.value = bottomSheetHeight.value
  if ('touches' in e) e.preventDefault()
}

function onDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value || !isMobile.value) return
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaY = dragStartY.value - clientY // 위로 드래그하면 양수
  let newHeight = dragStartHeight.value + deltaY
  
  const maxPx = getMaxSheetHeightPx()
  newHeight = Math.max(MIN_HEIGHT, Math.min(maxPx, newHeight))
  bottomSheetHeight.value = newHeight
  didDrag.value = true
  e.preventDefault()
}

function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  
  // 드래그 종료 시 스냅: 3단계 (핸들만 / 반 / 전체)
  const currentHeight = bottomSheetHeight.value
  const maxPx = getMaxSheetHeightPx()
  const defaultPx = getDefaultSheetHeightPx()
  const minMidPoint = (MIN_HEIGHT + defaultPx) / 2
  const halfMidPoint = (defaultPx + maxPx) / 2

  if (currentHeight < minMidPoint) {
    bottomSheetHeight.value = MIN_HEIGHT
  } else if (currentHeight < halfMidPoint) {
    bottomSheetHeight.value = defaultPx
  } else {
    bottomSheetHeight.value = maxPx
  }
  // 헤더 클릭이 토글하지 않도록 잠시 유지 후 초기화
  setTimeout(() => { didDrag.value = false }, 0)
}

function checkMobile() {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth < 768
  
  if (isMobile.value) {
    if (bottomSheetHeight.value === 0) {
      const defaultPx = getDefaultSheetHeightPx()
      // 모바일: 카드가 보이도록 최소 260px 보장 (MIN_HEIGHT만 되면 카드 영역이 숨겨짐)
      bottomSheetHeight.value = Math.max(defaultPx, 260)
    }
    const maxPx = getMaxSheetHeightPx()
    if (bottomSheetHeight.value > maxPx) bottomSheetHeight.value = maxPx
  } else if (!isMobile.value && wasMobile) {
    // 모바일에서 데스크톱으로 전환 시 높이 초기화
    bottomSheetHeight.value = 0
  }
}

function toggleBottomSheet() {
  if (!isMobile.value) return
  const currentHeight = bottomSheetHeight.value
  const maxPx = getMaxSheetHeightPx()
  // 3단계 순환: 핸들만 → 전체 → 반 → 핸들만
  if (currentHeight <= MIN_HEIGHT) {
    bottomSheetHeight.value = maxPx
  } else if (currentHeight >= maxPx) {
    bottomSheetHeight.value = getDefaultSheetHeightPx()
  } else {
    bottomSheetHeight.value = MIN_HEIGHT
  }
}

async function scrollListToAcademy(academyId: string) {
  await nextTick()
  const cardsContainer = academyListComponentRef.value?.academyCardsRef
  if (!cardsContainer) return
  // academyCardsRef 내부에서 해당 ID를 가진 요소 찾기
  const cardEl = cardsContainer.querySelector(`[data-academy-id="${academyId}"]`)
  if (!cardEl) return
  // overflow 컨테이너(.map-academy-cards) 기준으로 부드럽게 스크롤
  cardEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 카드 hover 시 지도 하이라이트/툴팁용 */
const hoveredAcademy = ref<Academy | null>(null)
const myLocation = ref<{ lat: number; lng: number } | null>(null)
/** 지도 보이는 영역으로 학원 목록 필터 (null이면 비활성) */
const visibleBoundsFilter = ref<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null)
/** 검색 드롭다운에서 선택 직후에는 필터 watch에서 선택 해제하지 않음 */
const skipClearSelectionFromFilter = ref(false)
const showLoginModal = ref(false)
const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const { isFavorited, toggle, loading: favoriteLoading } = useFavorites()

function handleSearchSelect(academy: Academy) {
  skipClearSelectionFromFilter.value = true
  searchSelectedAcademyId.value = academy.id
  selectedAcademy.value = academy
  setTimeout(() => { skipClearSelectionFromFilter.value = false }, 0)
}

function handleAcademyMouseenter(academy: Academy) {
  hoveredAcademy.value = academy
}

function handleAcademyMouseleave() {
  hoveredAcademy.value = null
}

function toggleAgeGroup(opt: string) {
  const i = selectedAgeGroups.value.indexOf(opt)
  if (i === -1) selectedAgeGroups.value = [...selectedAgeGroups.value, opt]
  else selectedAgeGroups.value = selectedAgeGroups.value.filter((x) => x !== opt)
}

// 프로필/선택된 사용자(학부모·자녀)가 바뀌면 대상나이 필터를 해당 연령 그룹으로 자동 지정
watch(
  profileAgeGroups,
  (groups) => {
    selectedAgeGroups.value = [...groups]
  },
  { immediate: true }
)

function toggleSubject(opt: string) {
  const i = selectedSubjects.value.indexOf(opt)
  if (i === -1) selectedSubjects.value = [...selectedSubjects.value, opt]
  else selectedSubjects.value = selectedSubjects.value.filter((x) => x !== opt)
}

let map: unknown = null
const markers: unknown[] = []
const markerByAcademyId = new Map<string, unknown>()
const markerSelectedState = new Map<string, boolean>() // 마커의 현재 선택 상태 추적 (성능 최적화)
const markerHoveredState = new Map<string, boolean>() // 마커의 현재 호버 상태 추적 (성능 최적화)
/** circle 라벨 (더 이상 사용하지 않음, destroyMap에서 정리용) */
let circleLabelEl: HTMLDivElement | null = null
/** 내 현재 위치 표시용 마커 */
let myLocationMarker: unknown = null



const filteredAcademies = computed(() => {
  const ageFilter = selectedAgeGroups.value
  const subFilter = selectedSubjects.value
  const bounds = visibleBoundsFilter.value
  const neighborhoodBoundary = myNeighborhood.boundary
  // 연령·과목·현재 보이는 지역 필터만 적용 (검색어는 목록/지도 필터에 사용하지 않음)
  const baseList = academies.value.filter((a) => {
    // 유효한 연령 그룹만 필터링에 사용
    const validAgeGroups = (a.age_group ?? []).filter(isValidAgeGroup)
    const matchAge = ageFilter.length === 0 || ageFilter.some((g) => isValidAgeGroup(g) && validAgeGroups.includes(g))
    // 유효한 과목만 필터링에 사용 (통합 과목명 기준: 코딩=로봇, 음악=피아노, 미술=디자인, 스포츠=축구/농구/수영/체육)
    const validSubjects = (a.subjects ?? []).filter(isValidSubject)
    const matchSub =
      subFilter.length === 0 ||
      subFilter.some((selectedCanonical) =>
        validSubjects.some((academySubject) => getCanonicalSubject(academySubject) === selectedCanonical)
      )
    if (!matchAge || !matchSub) return false
    if (bounds) {
      const lat = a.lat ?? 0
      const lng = a.lng ?? 0
      if (lat < bounds.sw.lat || lat > bounds.ne.lat || lng < bounds.sw.lng || lng > bounds.ne.lng) return false
    }
    return true
  })
  // 내 동네: 동 이름/주소가 아니라 boundary(경계) 안에 있는 학원만 표시
  if (!neighborhoodBoundary) return baseList
  const byBoundary = baseList.filter((a) => {
    const lat = a.lat ?? 0
    const lng = a.lng ?? 0
    return (
      lat >= neighborhoodBoundary.sw.lat &&
      lat <= neighborhoodBoundary.ne.lat &&
      lng >= neighborhoodBoundary.sw.lng &&
      lng <= neighborhoodBoundary.ne.lng
    )
  })
  return byBoundary.length > 0 ? byBoundary : baseList
})

const sortedAcademyList = computed(() => {
  const list = [...filteredAcademies.value]
  const sortBy = academyListSortBy.value
  if (sortBy === 'comments') {
    list.sort((a, b) => (commentCountByAcademyId.value[b.id] ?? 0) - (commentCountByAcademyId.value[a.id] ?? 0))
  } else {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  }
  return list
})

// 모바일: 바텀 시트가 최대 높이(전체 확장)인지 여부
const isBottomSheetMaximized = computed(() => {
  if (!isMobile.value) return false
  const maxPx = getMaxSheetHeightPx()
  return Math.abs(bottomSheetHeight.value - maxPx) < 1
})

const ACADEMY_ZOOM = 16

/** 지도 중심을 해당 학원 위치로 이동 */
function panMapToAcademy(academy: Academy) {
  const maps = getMaps()
  if (!maps || !map) return
  const center = new maps.LatLng(academy.lat, academy.lng)
  const m = map as {
    morph?: (c: unknown, z: number) => void
    panTo?: (c: unknown) => void
    setCenter?: (c: unknown) => void
    setZoom?: (z: number) => void
  }
  if (typeof m.morph === 'function') {
    m.morph(center, ACADEMY_ZOOM)
  } else if (typeof m.panTo === 'function') {
    m.panTo(center)
    if (typeof m.setZoom === 'function') m.setZoom(ACADEMY_ZOOM)
  } else {
    if (typeof m.setCenter === 'function') m.setCenter(center)
    if (typeof m.setZoom === 'function') m.setZoom(ACADEMY_ZOOM)
  }
}

/** 지도를 디폴트 위치로 이동 (내 위치 + 가장 가까운 학원 밀집 지역이 한 화면에 보이도록) */
function resetToDefault() {
  const maps = getMaps()
  if (!maps || !map) return
  if (myLocation.value) {
    fitMapToMyLocationAndCluster(myLocation.value.lat, myLocation.value.lng)
    return
  }
  if (!navigator.geolocation) {
    const center = new maps.LatLng(SONGDO_CENTER.lat, SONGDO_CENTER.lng)
    const m = map as { morph?: (c: unknown, z: number) => void; panTo?: (c: unknown) => void; setCenter?: (c: unknown) => void; setZoom?: (z: number) => void }
    const DEFAULT_ZOOM = 14
    if (typeof m.morph === 'function') m.morph(center, DEFAULT_ZOOM)
    else if (typeof m.panTo === 'function') { m.panTo(center); if (typeof m.setZoom === 'function') m.setZoom(DEFAULT_ZOOM) }
    else { if (typeof m.setCenter === 'function') m.setCenter(center); if (typeof m.setZoom === 'function') m.setZoom(DEFAULT_ZOOM) }
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      myLocation.value = { lat, lng }
      try {
        if (myLocationMarker) {
          ;(myLocationMarker as { setMap: (m: unknown) => void }).setMap(null)
          myLocationMarker = null
        }
        const markerHtml = createCircleIconHtml()
        const Size = maps.Size as new (width: number, height: number) => unknown
        const Point = maps.Point as new (x: number, y: number) => unknown
        myLocationMarker = new maps.Marker({
          position: new maps.LatLng(lat, lng),
          map,
          icon: { content: markerHtml, size: new Size(MARKER_ICON_SIZE, MARKER_ICON_SIZE), anchor: new Point(MARKER_ICON_SIZE / 2, MARKER_ICON_SIZE / 2) },
          zIndex: 300, // 학원 마커(호버 200)보다 위에 표시
        })
        fitMapToMyLocationAndCluster(lat, lng)
      } catch {
        // ignore
      }
    },
    () => {
      const center = new maps.LatLng(SONGDO_CENTER.lat, SONGDO_CENTER.lng)
      const m = map as { morph?: (c: unknown, z: number) => void; panTo?: (c: unknown) => void; setCenter?: (c: unknown) => void; setZoom?: (z: number) => void }
      const DEFAULT_ZOOM = 14
      if (typeof m.morph === 'function') m.morph(center, DEFAULT_ZOOM)
      else if (typeof m.panTo === 'function') { m.panTo(center); if (typeof m.setZoom === 'function') m.setZoom(DEFAULT_ZOOM) }
      else { if (typeof m.setCenter === 'function') m.setCenter(center); if (typeof m.setZoom === 'function') m.setZoom(DEFAULT_ZOOM) }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

function openAcademy(academy: Academy, opts?: { scrollList?: boolean }) {
  // 검색 드롭다운으로 선택했던 상태는, 목록/지도에서 다시 선택하면 해제
  searchSelectedAcademyId.value = null
  
  // 같은 학원을 다시 클릭하면 선택 해제
  if (selectedAcademy.value?.id === academy.id) {
    selectedAcademy.value = null
  } else {
    selectedAcademy.value = academy
    // 선택한 마커가 지도 가운데로 오도록 이동
    panMapToAcademy(academy)
  }
  // watch(selectedAcademy)가 자동으로 마커를 업데이트함
  
  // 선택한 학원 카드가 목록 상단에 오도록 스크롤 (목록·지도·검색 모두)
  scrollListToAcademy(academy.id)
  if (opts?.scrollList) {
    // 지도 마커 클릭 시에는 페이지로 이동하지 않고 선택만
    return
  }
  // 페이지로 이동
  router.push({ name: 'AcademyDetail', params: { id: academy.id } })
}

async function onCardFavoriteClick(academyId: string) {
  if (!auth.isAuthenticated) {
    showLoginModal.value = true
    return
  }
  try {
    await toggle(academyId)
  } catch (e) {
    alert(e instanceof Error ? e.message : '즐겨찾기 변경에 실패했습니다.')
  }
}

function loadNaverMapScript(): Promise<void> {
  if (typeof window !== 'undefined' && (window as Window).naver?.maps) {
    return Promise.resolve()
  }
  if (document.getElementById(SCRIPT_ID)) {
    return new Promise((resolve) => {
      const check = () => {
        if ((window as Window).naver?.maps) resolve()
        else setTimeout(check, 50)
      }
      check()
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.defer = true
    script.type = 'text/javascript'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Naver Map SDK load failed'))
    document.head.appendChild(script)
  })
}

const MarkerType = {
  Map: null as unknown as new (el: HTMLElement, opts: { center: unknown; zoom: number }) => unknown,
  LatLng: null as unknown as new (lat: number, lng: number) => unknown,
  Marker: null as unknown as new (opts: { position: unknown; map: unknown; icon?: { content: string | HTMLElement; size?: unknown; anchor?: unknown }; zIndex?: number }) => {
    addListener: (e: string, fn: () => void) => void
    setMap: (m: unknown) => void
    setIcon: (icon: { content: string | HTMLElement; size?: unknown; anchor?: unknown }) => void
    setZIndex: (z: number) => void
  },
  Size: null as unknown as new (width: number, height: number) => unknown,
  Point: null as unknown as new (x: number, y: number) => unknown,
  Circle: null as unknown as new (opts: { center: unknown; radius: number; map?: unknown; fillColor?: string; fillOpacity?: number; strokeColor?: string; strokeWeight?: number }) => {
    setMap: (m: unknown) => void
  },
}

function getMaps() {
  const naver = (window as Window).naver
  if (!naver?.maps) return null
  return naver.maps as typeof MarkerType
}

async function initMap(academyList: Academy[]) {
  await nextTick()
  const maps = getMaps()
  const containerEl = mapContainerComponentRef.value?.mapContainerRef
  if (!maps || !containerEl) {
    console.warn('Map init skipped: maps=', !!maps, 'containerEl=', !!containerEl, 'mapContainerComponentRef=', !!mapContainerComponentRef.value)
    return
  }

  map = new maps.Map(containerEl, {
    center: new maps.LatLng(SONGDO_CENTER.lat, SONGDO_CENTER.lng),
    zoom: 14,
  })
  mapReady.value = true

  updateMarkers(academyList)
  // '위치 찾기' 클릭 후 지도로 온 경우: 내 위치 표시 후 플래그 해제
  if (myNeighborhood.requestShowMyLocation) {
    showMyLocation()
    myNeighborhood.requestShowMyLocation = false
  }
  // 학원 상세 등에서 지도로 돌아온 경우: 저장된 내 위치 마커 복원
  else if (myNeighborhood.lastLocation) {
    showMyLocationAt(myNeighborhood.lastLocation.lat, myNeighborhood.lastLocation.lng)
  }
}

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

/** LatLng 객체에서 위도·경도 숫자 추출 (네이버 지도 API 형태에 맞춤) */
function coordLat(p: unknown): number {
  if (p == null) return 0
  const o = p as { lat?: () => number; lng?: () => number; lat?: number; lng?: number; x?: number; y?: number }
  if (typeof o.lat === 'function') return o.lat()
  if (typeof o.lat === 'number') return o.lat
  if (typeof o.y === 'number') return o.y
  return (o as { x?: number }).x ?? 0
}

function coordLng(p: unknown): number {
  if (p == null) return 0
  const o = p as { lat?: () => number; lng?: () => number; lat?: number; lng?: number; x?: number; y?: number }
  if (typeof o.lng === 'function') return o.lng()
  if (typeof o.lng === 'number') return o.lng
  if (typeof o.x === 'number') return o.x
  return (o as { y?: number }).y ?? 0
}

/** 두 좌표 거리 제곱 (도 단위, 비교용) */
function distSqDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dlat = lat1 - lat2
  const dlng = lng1 - lng2
  return dlat * dlat + dlng * dlng
}

/** 사용자 위치에서 가장 가까운 "5개 이상 밀집 학원" 지역의 중심과 해당 학원 목록 반환. 없으면 null */
function findNearestDenseCluster(
  userLat: number,
  userLng: number,
  academyList: Academy[]
): { center: { lat: number; lng: number }; academies: Academy[] } | null {
  const RADIUS_DEG = 0.02
  const R_SQ = RADIUS_DEG * RADIUS_DEG
  const MIN_COUNT = 5
  const list = academyList.filter((a) => a.lat != null && a.lng != null)
  let best: { center: { lat: number; lng: number }; academies: Academy[] } | null = null
  let bestDistSq = Infinity
  for (const a of list) {
    const latA = a.lat ?? 0
    const lngA = a.lng ?? 0
    const nearby = list.filter((b) => {
      const latB = b.lat ?? 0
      const lngB = b.lng ?? 0
      return distSqDeg(latA, lngA, latB, lngB) <= R_SQ
    })
    if (nearby.length >= MIN_COUNT) {
      const clat = nearby.reduce((s, x) => s + (x.lat ?? 0), 0) / nearby.length
      const clng = nearby.reduce((s, x) => s + (x.lng ?? 0), 0) / nearby.length
      const d = distSqDeg(userLat, userLng, clat, clng)
      if (d < bestDistSq) {
        bestDistSq = d
        best = { center: { lat: clat, lng: clng }, academies: nearby }
      }
    }
  }
  return best
}

/** 디폴트 지도 뷰: 내 위치와 가장 가까운 학원 밀집 지역을 한 화면에 fitBounds */
function fitMapToMyLocationAndCluster(lat: number, lng: number) {
  const maps = getMaps()
  if (!maps || !map) return
  const cluster = findNearestDenseCluster(lat, lng, academies.value)
  const m = map as {
    fitBounds?: (bounds: unknown, options?: { top?: number; right?: number; bottom?: number; left?: number; maxZoom?: number }) => void
    morph?: (c: unknown, z: number) => void
    panTo?: (c: unknown) => void
    setCenter?: (c: unknown) => void
    setZoom?: (z: number) => void
  }
  const FIT_MARGIN = 48
  const FIT_MAX_ZOOM = 16
  if (typeof m.fitBounds === 'function') {
    const coords: unknown[] = [new maps.LatLng(lat, lng)]
    if (cluster?.academies?.length) {
      cluster.academies.forEach((a) => {
        if (a.lat != null && a.lng != null) coords.push(new maps.LatLng(a.lat, a.lng))
      })
    }
    m.fitBounds(coords, {
      top: FIT_MARGIN,
      right: FIT_MARGIN,
      bottom: FIT_MARGIN,
      left: FIT_MARGIN,
      maxZoom: FIT_MAX_ZOOM,
    })
  } else {
    const centerLat = cluster?.center?.lat ?? lat
    const centerLng = cluster?.center?.lng ?? lng
    const center = new maps.LatLng(centerLat, centerLng)
    if (typeof m.morph === 'function') {
      m.morph(center, 15)
    } else if (typeof m.panTo === 'function') {
      m.panTo(center)
      if (typeof m.setZoom === 'function') m.setZoom(15)
    } else {
      if (typeof m.setCenter === 'function') m.setCenter(center)
      if (typeof m.setZoom === 'function') m.setZoom(15)
    }
  }
}

/** 내 위치 마커를 (lat, lng)에 표시하고 fitBounds (저장된 위치 복원 또는 getCurrentPosition 성공 후 호출) */
function showMyLocationAt(lat: number, lng: number) {
  const maps = getMaps()
  if (!maps || !map) return
  myLocation.value = { lat, lng }
  myNeighborhood.lastLocation = { lat, lng }
  try {
    if (myLocationMarker) {
      ;(myLocationMarker as { setMap: (m: unknown) => void }).setMap(null)
      myLocationMarker = null
    }
    const markerHtml = createCircleIconHtml()
    const Size = maps.Size as new (width: number, height: number) => unknown
    const Point = maps.Point as new (x: number, y: number) => unknown
    myLocationMarker = new maps.Marker({
      position: new maps.LatLng(lat, lng),
      map,
      icon: {
        content: markerHtml,
        size: new Size(MARKER_ICON_SIZE, MARKER_ICON_SIZE),
        anchor: new Point(MARKER_ICON_SIZE / 2, MARKER_ICON_SIZE / 2),
      },
      zIndex: 300, // 학원 마커(호버 200)보다 위에 표시
    })
    fitMapToMyLocationAndCluster(lat, lng)
  } catch {
    // ignore
  }
}

/** 내 현재 위치를 지도에 표시; 줌은 내 위치와 학원 밀집 지역이 모두 보이도록 fitBounds (위치 찾기 클릭 시 호출) */
function showMyLocation() {
  if (!map || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      showMyLocationAt(lat, lng)
    },
    () => {
      // 권한 거부 또는 조회 실패 시 무시 (알림 없음)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

function searchVisibleBounds() {
  if (!map) return
  const m = map as {
    getBounds?: () => {
      getSouthWest?: () => unknown
      getNorthEast?: () => unknown
    }
    getCenter?: () => unknown
    getZoom?: () => number
  }
  let sw: { lat: number; lng: number }
  let ne: { lat: number; lng: number }
  const bounds = typeof m.getBounds === 'function' ? m.getBounds() : null
  if (bounds && typeof bounds.getSouthWest === 'function' && typeof bounds.getNorthEast === 'function') {
    const swPt = bounds.getSouthWest()
    const nePt = bounds.getNorthEast()
    sw = { lat: coordLat(swPt), lng: coordLng(swPt) }
    ne = { lat: coordLat(nePt), lng: coordLng(nePt) }
  } else {
    const center = typeof m.getCenter === 'function' ? m.getCenter() : null
    const zoom = typeof m.getZoom === 'function' ? m.getZoom() : 14
    const lat = coordLat(center)
    const lng = coordLng(center)
    const span = 0.02 * Math.pow(0.5, Math.max(0, zoom - 14))
    sw = { lat: lat - span, lng: lng - span }
    ne = { lat: lat + span, lng: lng + span }
  }
  visibleBoundsFilter.value = { sw, ne }
}

function zoomIn() {
  if (!map) return
  const m = map as { getZoom?: () => number; getMaxZoom?: () => number; setZoom?: (z: number) => void }
  const current = typeof m.getZoom === 'function' ? m.getZoom() : 14
  const max = typeof m.getMaxZoom === 'function' ? m.getMaxZoom() : 21
  const next = Math.min(current + 1, max)
  if (typeof m.setZoom === 'function') m.setZoom(next)
}

function zoomOut() {
  if (!map) return
  const m = map as { getZoom?: () => number; getMinZoom?: () => number; setZoom?: (z: number) => void }
  const current = typeof m.getZoom === 'function' ? m.getZoom() : 14
  const min = typeof m.getMinZoom === 'function' ? m.getMinZoom() : 6
  const next = Math.max(current - 1, min)
  if (typeof m.setZoom === 'function') m.setZoom(next)
}


/** 선택/호버된 학원 마커를 맨 위로 (setZIndex + re-add, 호버 > 선택 > 기본) */
function updateMarkerZIndex() {
  if (!map) return
  const selectedId = selectedAcademy.value?.id ?? null
  const hoveredId = hoveredAcademy.value?.id ?? null
  // z-index 토큰 사용 (CSS 변수에서 가져오거나 fallback)
  const getZIndex = (token: string, fallback: number) => {
    if (typeof document === 'undefined') return fallback
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    return value ? parseInt(value, 10) : fallback
  }
  const Z = {
    base: getZIndex('--z-canvas', 10),
    selected: getZIndex('--z-toast', 100),
    hovered: getZIndex('--z-floating', 200)
  }
  const setZ = (m: unknown, z: number) => {
    try {
      ;(m as { setZIndex?: (z: number) => void }).setZIndex?.(z)
    } catch {
      // ignore
    }
  }
  markerByAcademyId.forEach((marker, academyId) => {
    if (academyId === hoveredId) setZ(marker, Z.hovered)
    else if (academyId === selectedId) setZ(marker, Z.selected)
    else setZ(marker, Z.base)
  })
  const setMap = (m: unknown, toMap: unknown) => {
    try {
      ;(m as { setMap: (map: unknown) => void }).setMap(toMap)
    } catch {
      // ignore
    }
  }
  if (selectedId && selectedId !== hoveredId) {
    const m = markerByAcademyId.get(selectedId)
    if (m) {
      setMap(m, null)
      setMap(m, map)
    }
  }
  if (hoveredId) {
    const m = markerByAcademyId.get(hoveredId)
    if (m) {
      setMap(m, null)
      setMap(m, map)
    }
  }
}


/** 마커 HTML: MDI 네모(square) 아이콘만 (텍스트 없음, 내 위치용) - 선택된 마커와 동일한 스타일 적용 */
function createCircleIconHtml(color: string = '#ff5a5f'): string {
  // 선택된 마커와 동일한 스타일: primary 배경, 흰색 아이콘, 흰색 테두리
  const bgColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#ff5a5f')
    : '#ff5a5f'
  const iconColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--color-text-inverse').trim() || '#ffffff')
    : '#ffffff'
  const borderColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue('--color-text-inverse').trim() || '#ffffff')
    : '#ffffff'
  const bgEscaped = bgColor.replace(/"/g, '&quot;')
  const iconEscaped = iconColor.replace(/"/g, '&quot;')
  const borderEscaped = borderColor.replace(/"/g, '&quot;')
  const iconSvg = `<svg viewBox="0 0 24 24" width="${MARKER_ICON_SIZE}" height="${MARKER_ICON_SIZE}" xmlns="http://www.w3.org/2000/svg"><path d="${MY_LOCATION_MARKER_ICON}" fill="${iconEscaped}"/></svg>`
  return `<span style="display:flex;align-items:center;justify-content:center;padding:0.25rem;background-color:${bgEscaped};border-radius:50%;border:2px solid ${borderEscaped};">${iconSvg}</span>`
}

/** 마커 HTML: 과목별 MDI 아이콘 + 학원 이름 칩 (선택: 배경 primary+아이콘 white+테두리 white, 호버: 배경 dimmer+아이콘 dim+테두리 stronger, 일반: 배경 dimmer+아이콘 dim+테두리 dim). 과목 아이콘은 subjectTypes.getSubjectIconPath 사용 */
function createMarkerIconHtml(academyName: string, isSelected: boolean, subjects: string[] = [], isHovered: boolean = false): string {
  // 선택: primary 배경, 호버/일반: dimmer 배경
  const bgColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue(isSelected ? '--color-primary' : '--color-bg-base').trim() || (isSelected ? '#ff5a5f' : '#f5f5f5'))
    : (isSelected ? '#ff5a5f' : '#f5f5f5')
  // 선택: 흰색 아이콘, 호버/일반: dim 색상 아이콘 (호버 시 아이콘 색상 변경 없음)
  const iconColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue(isSelected ? '--color-text-inverse' : '--color-text-dim').trim() || (isSelected ? '#ffffff' : '#717171'))
    : (isSelected ? '#ffffff' : '#717171')
  const baseClasses = 'chip chip-small'
  const activeClass = isSelected ? ' chip-active' : ''
  const classes = baseClasses + activeClass
  // 선택: 흰색 테두리, 호버: stronger 테두리, 일반: dim 테두리
  const borderColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue(
        isSelected ? '--color-text-inverse' : (isHovered ? '--color-border-stronger' : '--color-border-dim')
      ).trim() || (isSelected ? '#ffffff' : (isHovered ? '#d0d0d0' : '#ebebeb')))
    : (isSelected ? '#ffffff' : (isHovered ? '#d0d0d0' : '#ebebeb'))
  // 학원 이름 칩 스타일: 선택/호버 시 테두리와 텍스트 색상 변경
  const chipBorderColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue(
        isSelected ? '--color-border-stronger' : (isHovered ? '--color-border-stronger' : '--color-border-dim')
      ).trim() || (isSelected ? '#d0d0d0' : (isHovered ? '#d0d0d0' : '#ebebeb')))
    : (isSelected ? '#d0d0d0' : (isHovered ? '#d0d0d0' : '#ebebeb'))
  const chipTextColor = typeof document !== 'undefined'
    ? (getComputedStyle(document.documentElement).getPropertyValue(
        isSelected ? '--color-text-base' : (isHovered ? '--color-text-base' : '--color-text-dim')
      ).trim() || (isSelected ? '#1a1a1a' : (isHovered ? '#1a1a1a' : '#717171')))
    : (isSelected ? '#1a1a1a' : (isHovered ? '#1a1a1a' : '#717171'))
  const chipFontWeight = isSelected || isHovered ? '600' : '500'
  const bgEscaped = bgColor.replace(/"/g, '&quot;')
  const iconEscaped = iconColor.replace(/"/g, '&quot;')
  const borderEscaped = borderColor.replace(/"/g, '&quot;')
  const chipBorderEscaped = chipBorderColor.replace(/"/g, '&quot;')
  const chipTextEscaped = chipTextColor.replace(/"/g, '&quot;')
  const iconPath = getSubjectIconPath(subjects)
  // 배경색 원 + 흰색 아이콘 (padding 0.25rem = 4px)
  const iconSvg = `<svg viewBox="0 0 24 24" width="${MARKER_ICON_SIZE}" height="${MARKER_ICON_SIZE}" xmlns="http://www.w3.org/2000/svg"><path d="${iconPath}" fill="${iconEscaped}"/></svg>`
  // 학원 이름 칩에 인라인 스타일 적용 (호버/선택 상태 반영)
  const chipStyle = `box-shadow: inset 0 0 0 ${isSelected ? '2px' : '1px'} ${chipBorderEscaped}; color: ${chipTextEscaped}; font-weight: ${chipFontWeight};`
  return `<div style="display:flex;align-items:center;gap:0.25rem;"><span style="flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:0.25rem;background-color:${bgEscaped};border-radius:50%;border:2px solid ${borderEscaped};">${iconSvg}</span><span class="${classes}" style="${chipStyle}">${academyName}</span></div>`
}

/** 특정 마커의 아이콘을 업데이트 (선택/호버 상태 반영) */
function updateMarkerIcon(academyId: string, isSelected: boolean) {
  const maps = getMaps()
  if (!maps) return
  const marker = markerByAcademyId.get(academyId)
  if (!marker) return
  
  const isHovered = hoveredAcademy.value?.id === academyId
  
  // 현재 상태와 동일하면 업데이트하지 않음 (성능 최적화)
  const wasSelected = markerSelectedState.get(academyId) === isSelected
  const wasHovered = markerHoveredState.get(academyId) === isHovered
  // 선택 상태와 호버 상태가 모두 동일하면 업데이트하지 않음
  if (wasSelected && wasHovered) return
  
  // academies 또는 filteredAcademies에서 찾기
  const academy = academies.value.find((a) => a.id === academyId) || filteredAcademies.value.find((a) => a.id === academyId)
  if (!academy) return
  
  const markerHtml = createMarkerIconHtml(academy.name, isSelected, academy.subjects, isHovered)
  const Size = maps.Size as new (width: number, height: number) => unknown
  const Point = maps.Point as new (x: number, y: number) => unknown
  
  try {
    // setIcon을 먼저 시도
    const setIconMethod = (marker as { setIcon?: (icon: { content: string; size?: unknown; anchor?: unknown }) => void }).setIcon
    if (typeof setIconMethod === 'function') {
      setIconMethod.call(marker, {
        content: markerHtml,
        size: new Size(0, 0),
        anchor: new Point(MARKER_ANCHOR_X, MARKER_ANCHOR_Y),
      })
      markerSelectedState.set(academyId, isSelected) // 상태 저장
      markerHoveredState.set(academyId, isHovered) // 호버 상태 저장
      return // 성공하면 종료
    }
    
    // setIcon이 없으면 마커를 재생성 (fallback)
    const position = (marker as { getPosition?: () => { lat: () => number; lng: () => number } }).getPosition?.()
    if (!position) return
    
    const lat = position.lat()
    const lng = position.lng()
    
    // 기존 마커 제거
    ;(marker as { setMap: (m: unknown) => void }).setMap(null)
    markerByAcademyId.delete(academyId)
    const markerIndex = markers.findIndex((m) => m === marker)
    if (markerIndex !== -1) {
      markers.splice(markerIndex, 1)
    }
    
    // 새 마커 생성
    const newMarker = new maps.Marker({
      position: new maps.LatLng(lat, lng),
      map,
      icon: {
        content: markerHtml,
        size: new Size(0, 0),
        anchor: new Point(MARKER_ANCHOR_X, MARKER_ANCHOR_Y),
      },
    })

    newMarker.addListener('click', (e: unknown) => {
      // 이벤트 전파 방지
      if (e && typeof e === 'object' && 'domEvent' in e) {
        const domEvent = (e as { domEvent?: Event }).domEvent
        if (domEvent) {
          domEvent.stopPropagation()
          domEvent.preventDefault()
        }
      }
      openAcademy(academy, { scrollList: true })
    })
    newMarker.addListener('mouseover', () => {
      hoveredAcademy.value = academy
    })
    newMarker.addListener('mouseout', () => {
      hoveredAcademy.value = null
    })
    
    markerByAcademyId.set(academyId, newMarker)
    markers.push(newMarker)
    markerSelectedState.set(academyId, isSelected) // 상태 저장
    markerHoveredState.set(academyId, isHovered) // 호버 상태 저장
  } catch (e) {
    console.error('마커 아이콘 업데이트 실패:', e)
  }
}

function updateMarkers(academyList: Academy[]) {
  const maps = getMaps()
  if (!maps || !map) return

  markers.forEach((m) => {
    try {
      (m as { setMap: (map: unknown) => void }).setMap(null)
    } catch {
      // ignore
    }
  })
  markers.length = 0
  markerByAcademyId.clear()
  markerSelectedState.clear() // 마커 선택 상태 초기화
  markerHoveredState.clear() // 마커 호버 상태 초기화

  academyList.forEach((academy) => {
    const position = new maps.LatLng(academy.lat, academy.lng)
    const isSelected = selectedAcademy.value?.id === academy.id
    const isHovered = hoveredAcademy.value?.id === academy.id
    
    const markerHtml = createMarkerIconHtml(academy.name, isSelected, academy.subjects, isHovered)
    const Size = maps.Size as new (width: number, height: number) => unknown
    const Point = maps.Point as new (x: number, y: number) => unknown
    
    const marker = new maps.Marker({
      position,
      map,
      title: academy.name,
      icon: {
        content: markerHtml,
        size: new Size(0, 0),
        anchor: new Point(MARKER_ANCHOR_X, MARKER_ANCHOR_Y),
      },
    })
    
    marker.addListener('click', (e: unknown) => {
      // 이벤트 전파 방지
      if (e && typeof e === 'object' && 'domEvent' in e) {
        const domEvent = (e as { domEvent?: Event }).domEvent
        if (domEvent) {
          domEvent.stopPropagation()
          domEvent.preventDefault()
        }
      }
      openAcademy(academy, { scrollList: true })
    })
    marker.addListener('mouseover', () => {
      hoveredAcademy.value = academy
    })
    marker.addListener('mouseout', () => {
      hoveredAcademy.value = null
    })
    markers.push(marker)
    markerByAcademyId.set(academy.id, marker)
    markerSelectedState.set(academy.id, isSelected) // 초기 상태 저장
    markerHoveredState.set(academy.id, isHovered) // 초기 호버 상태 저장
  })
  updateMarkerZIndex()
}

function destroyMap() {
  const naver = (window as Window).naver
  if (!naver?.maps) return
  const maps = naver.maps as { Marker: { prototype: { setMap: (m: unknown) => void } } }
  markers.forEach((m) => {
    try {
      (m as { setMap: (map: unknown) => void }).setMap(null)
    } catch {
      // ignore
    }
  })
  markers.length = 0
  markerByAcademyId.clear()
  if (circleLabelEl?.parentNode) {
    circleLabelEl.parentNode.removeChild(circleLabelEl)
    circleLabelEl = null
  }
  if (myLocationMarker) {
    try {
      ;(myLocationMarker as { setMap: (m: unknown) => void }).setMap(null)
    } catch {
      // ignore
    }
    myLocationMarker = null
  }
  if (map && typeof (map as { destroy?: () => void }).destroy === 'function') {
    (map as { destroy: () => void }).destroy()
  }
  map = null
  mapReady.value = false
}

async function fetchAcademies(): Promise<Academy[]> {
  const withImage = await supabase.from('academies').select('id, name, address, address_road, lat, lng, subjects, age_group, image_url, ai_analysis')
  if (!withImage.error) {
    return (withImage.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address ?? '',
      address_road: (row as { address_road?: string | null }).address_road ?? null,
      lat: row.lat,
      lng: row.lng,
      subjects: row.subjects ?? [],
      age_group: row.age_group ?? null,
      image_url: row.image_url ?? null,
      ai_analysis: (row as { ai_analysis?: string | null }).ai_analysis ?? null,
    }))
  }
  const code = (withImage.error as { code?: string }).code
  const msg = (withImage.error as { message?: string }).message ?? ''
  if (code === '42703' || msg.includes('image_url') || msg.includes('age_group') || msg.includes('ai_analysis') || msg.includes('address_road')) {
    const { data, error } = await supabase.from('academies').select('id, name, address, lat, lng, subjects, age_group, image_url')
    if (error) throw error
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address ?? '',
      address_road: null,
      lat: row.lat,
      lng: row.lng,
      subjects: row.subjects ?? [],
      age_group: row.age_group ?? null,
      image_url: row.image_url ?? null,
      ai_analysis: null,
    }))
  }
  throw withImage.error
}

async function fetchCommentCounts() {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('academy_id')
      .eq('is_hidden', false)
    if (error) throw error
    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((row) => {
      const id = row.academy_id
      counts[id] = (counts[id] ?? 0) + 1
    })
    commentCountByAcademyId.value = counts
  } catch (e) {
    console.error('Comment counts fetch failed:', e)
    commentCountByAcademyId.value = {}
  }
}

watch(filteredAcademies, (list) => {
  // 검색 드롭다운에서 방금 선택한 경우 선택 해제하지 않음 (하이라이트 유지)
  if (skipClearSelectionFromFilter.value) {
    const withSelected =
      selectedAcademy.value && !list.some((a) => a.id === selectedAcademy.value!.id)
        ? [...list, selectedAcademy.value!]
        : list
    if (map) updateMarkers(withSelected)
    return
  }
  if (map) updateMarkers(list)
  // 필터 변경으로 선택된 학원이 목록에 없으면 선택 해제
  if (selectedAcademy.value && !list.some((a) => a.id === selectedAcademy.value!.id)) {
    selectedAcademy.value = null
    hoveredAcademy.value = null
  }
}, { immediate: false })


watch(selectedAcademy, (newAcademy, oldAcademy) => {
  // 모바일: 지도에서 학원 선택 시 바텀 시트를 펼쳐 단일 카드가 보이도록
  if (newAcademy && isMobile.value && bottomSheetHeight.value <= MIN_HEIGHT + 50) {
    bottomSheetHeight.value = Math.max(320, getDefaultSheetHeightPx() * 0.5)
  }
  // 선택 상태 변경 시 변경된 마커만 업데이트
  if (!map) return
  
  const newSelectedId = newAcademy?.id ?? null
  const oldSelectedId = oldAcademy?.id ?? null
  
  // 선택 상태가 변경되지 않았으면 업데이트하지 않음
  if (newSelectedId === oldSelectedId) return
  
  // 이전에 선택된 마커 해제
  if (oldSelectedId && markerByAcademyId.has(oldSelectedId)) {
    const wasSelected = markerSelectedState.get(oldSelectedId)
    if (wasSelected) {
      updateMarkerIcon(oldSelectedId, false)
    }
  }
  
  // 새로 선택된 마커 활성화
  if (newSelectedId && markerByAcademyId.has(newSelectedId)) {
    const isCurrentlySelected = markerSelectedState.get(newSelectedId)
    if (!isCurrentlySelected) {
      updateMarkerIcon(newSelectedId, true)
    }
  }
  updateMarkerZIndex()
})

watch(hoveredAcademy, (newHovered, oldHovered) => {
  const newHoveredId = newHovered?.id ?? null
  const oldHoveredId = oldHovered?.id ?? null
  
  // 이전 호버 해제
  if (oldHoveredId && markerByAcademyId.has(oldHoveredId)) {
    const wasSelected = markerSelectedState.get(oldHoveredId) ?? false
    updateMarkerIcon(oldHoveredId, wasSelected)
  }
  
  // 새로운 호버 적용
  if (newHoveredId && markerByAcademyId.has(newHoveredId)) {
    const isSelected = markerSelectedState.get(newHoveredId) ?? false
    updateMarkerIcon(newHoveredId, isSelected)
  }
  
  updateMarkerZIndex()
})

// '위치 찾기' 클릭 시 지도에 내 위치 표시 (지도 페이지에 있을 때)
watch(() => myNeighborhood.requestShowMyLocation, (v) => {
  if (v && map) {
    showMyLocation()
    myNeighborhood.requestShowMyLocation = false
  }
})

// 헤더에서 내 동네 X(해제) 시 지도에서 내 위치 마커도 제거
watch(() => myNeighborhood.lastLocation, (v) => {
  if (v !== null) return
  myLocation.value = null
  if (myLocationMarker) {
    try {
      ;(myLocationMarker as { setMap: (m: unknown) => void }).setMap(null)
    } catch {
      // ignore
    }
    myLocationMarker = null
  }
})

// 모바일: 바텀 시트 높이 변경 시 지도 영역이 바뀌므로 지도 리사이즈
watch(bottomSheetHeight, () => {
  if (!isMobile.value || !map) return
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })
})

function onDocumentClick(e: MouseEvent) {
  // 지도 밖 클릭 시 마커 하이라이트·학원 카드 선택 해제 (지도·학원 목록·검색 클릭은 제외)
  const target = e.target as Node
  const el = e.target as Element
  const containerEl = mapContainerComponentRef.value?.mapContainerRef
  if (containerEl?.contains(target)) return
  if (el.closest?.('.map-academy-card')) return
  if (el.closest?.('.map-academy-list')) return // 학원 목록(헤더·정렬 칩·카드) 클릭 시 선택 해제하지 않음
  if (el.closest?.('.map-search-wrap')) return // 검색 입력·드롭다운 선택 시 선택 해제하지 않음
  selectedAcademy.value = null
  hoveredAcademy.value = null
}

let categoryBarResizeObserver: ResizeObserver | null = null

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', onDragEnd)
  
  await auth.init()
  try {
    academies.value = await fetchAcademies()
    await fetchCommentCounts()
    await loadNaverMapScript()
    // loading이 false가 되어 컴포넌트가 렌더링될 때까지 기다림
    loading.value = false
    await nextTick()
    await nextTick() // 컴포넌트 마운트를 위한 추가 대기
    // 모바일: 실제 필터/헤더 레이아웃 기준으로 바텀시트 높이 재계산 (초기 로딩 시 지도·카드 보이도록)
    if (isMobile.value) {
      requestAnimationFrame(() => {
        const defaultPx = getDefaultSheetHeightPx()
        bottomSheetHeight.value = Math.max(defaultPx, 260)
        const maxPx = getMaxSheetHeightPx()
        if (bottomSheetHeight.value > maxPx) bottomSheetHeight.value = maxPx
      })
    }
    // mapContainerRef가 준비될 때까지 최대 20번 시도 (약 1초)
    let retries = 0
    while (!mapContainerComponentRef.value?.mapContainerRef && retries < 20) {
      await new Promise(resolve => setTimeout(resolve, 50))
      retries++
    }
    if (!mapContainerComponentRef.value?.mapContainerRef) {
      console.warn('MapContainer ref not found after retries, will retry later')
      // 에러 대신 경고만 표시하고 나중에 다시 시도
      setTimeout(async () => {
        if (mapContainerComponentRef.value?.mapContainerRef && !map) {
          await initMap(filteredAcademies.value)
        }
      }, 500)
    } else {
      await initMap(filteredAcademies.value)
    }
  } catch (e) {
    console.error('Map init failed:', e)
    const containerEl = mapContainerComponentRef.value?.mapContainerRef
    if (containerEl) {
      const msg = e instanceof Error ? e.message : String(e)
      const isNaver = /naver|ncpKeyId|script/i.test(msg) || msg.includes('load failed')
      containerEl.innerHTML = `<p class="map-error">지도를 불러올 수 없습니다.${isNaver ? ' VITE_NAVER_MAP_CLIENT_ID를 확인하세요.' : ''} ${!isNaver ? msg : ''}</p>`
    }
  } finally {
    // loading은 이미 false로 설정됨
  }
  // 필터(대상연령/과목) 높이 변경 시 학원 목록 최대 높이 재적용
  nextTick(() => {
    const el = categoryBarRef.value
    if (!el || typeof ResizeObserver === 'undefined') return
    categoryBarResizeObserver = new ResizeObserver(() => {
      if (!isMobile.value) return
      const maxPx = getMaxSheetHeightPx()
      if (bottomSheetHeight.value > maxPx) bottomSheetHeight.value = maxPx
    })
    categoryBarResizeObserver.observe(el)
  })
  const stored = sessionStorage.getItem('openComposerAfterAuth')
  if (stored && auth.isAuthenticated) {
    sessionStorage.removeItem('openComposerAfterAuth')
    const academy = academies.value.find((a) => a.id === stored)
    if (academy) {
      // 페이지로 이동하고 쿼리 파라미터로 컴포저 열기 표시
      router.push({ 
        name: 'AcademyDetail', 
        params: { id: academy.id },
        query: { openComposer: 'true' }
      })
    }
  }
})

onBeforeUnmount(() => {
  categoryBarResizeObserver?.disconnect()
  categoryBarResizeObserver = null
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragEnd)
  destroyMap()
})
</script>

<style lang="scss" scoped>
@use 'sass:color';

.map-page {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.map-page-header {
  flex-shrink: 0;
  padding: v.$space-md v.$space-lg;
  background: v.$color-bg-base;
  border-bottom: 1px solid v.$color-border-dim;

  @media (min-width: 768px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.map-page-filter-section {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;

  /* 필터 섹션 안에서는 MapCategoryBar 패딩 제거(헤더 패딩으로 통일) */
  :deep(.map-category-bar) {
    padding: 0;
  }
}

.map-content {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  
  @media (max-width: 767px) {
    flex-direction: column;
  }
  
  @media (min-width: 768px) {
    flex-direction: row;
  }
}

// 모바일: 지도+리스트가 들어가는 내부 영역 (100% 기준이 되도록 높이 확정)
.map-content-inner {
  flex: 1 1 0%;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex: 1;
    flex-direction: row;
  }
}

// 모바일: 학원 목록 전체 확장 시 하단 중앙에 노출되는 '지도 보기' 버튼
.map-show-map-button {
  position: fixed;
  left: 50%;
  bottom: v.$space-md;
  transform: translateX(-50%);
  z-index: v.$z-card;
}

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: v.$overlay-loading;
  z-index: v.$z-canvas;
}

.map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin: 0;
  padding: v.$space-xl;
  text-align: center;
}
</style>


