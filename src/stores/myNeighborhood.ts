import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mapLocationFinderToAddress } from '@/constants/address'

/** OpenStreetMap Nominatim. 개발 시 Vite 프록시(/api/nominatim) 사용해 CORS 회피 */
const NOMINATIM_BASE =
  import.meta.env.DEV ? '/api/nominatim' : 'https://nominatim.openstreetmap.org'
const NOMINATIM_REVERSE_URL = `${NOMINATIM_BASE}/reverse`

/**
 * 내 동네 스토어
 * 위치 찾기: GPS → 역지오코딩으로 동 이름 표시 + 지도에 현재 위치 마커 (경계 필터 없음)
 */
export const useMyNeighborhoodStore = defineStore('myNeighborhood', () => {
  /** 동 이름 (읍/면/동 또는 시/군/구) — 표시용 */
  const name = ref<string | null>(null)
  /** 시·구 등 지역 — 표시용 */
  const region = ref<string | null>(null)
  const loading = ref(false)
  /** 지도에 내 위치 표시 요청 (위치 찾기 클릭 시 true → MapPageView에서 showMyLocation 호출 후 false) */
  const requestShowMyLocation = ref(false)
  /** 동네 찾기 모달에서 적용 후, 선택한 동네의 학원 밀집 영역으로 지도 이동 요청 */
  const requestFitMapToSelectedAddress = ref(false)
  /** 마지막으로 확인한 내 위치 (지도 마커·복원용) */
  const lastLocation = ref<{ lat: number; lng: number } | null>(null)
  /** 동네 찾기 모달 열림 여부 */
  const showLocationSelectModal = ref(false)
  /** 선택된 주소 목록 (동/읍/면 단위 다중 선택). 학원 필터에 사용 */
  const selectedAddresses = ref<Array<{ sido: string; gugun: string; dong?: string }>>([])
  /** 내 위치 버튼으로 설정한 주소 (모달에서 버튼 옆 칩 표시용) */
  const myLocationAddress = ref<{ sido: string; gugun: string; dong?: string } | null>(null)

  /** 역지오코딩: 위경도 → 주소(동 + 시·구). Nominatim 사용, 한국어 주소 요청 */
  async function reverseGeocode(
    lat: number,
    lng: number
  ): Promise<{ name: string; region: string | null } | null> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'ko',
    })
    const res = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
      headers: { 'Accept-Language': 'ko', 'User-Agent': 'DU-Academy-App/1.0' },
    })
    if (!res.ok) throw new Error('주소 조회 실패')
    const data = (await res.json()) as {
      address?: {
        suburb?: string
        neighbourhood?: string
        quarter?: string
        city_district?: string
        town?: string
        village?: string
        county?: string
        city?: string
        state?: string
      }
    }
    const addr = data?.address
    if (!addr) return null
    const dong =
      addr.suburb?.trim() ||
      addr.neighbourhood?.trim() ||
      addr.quarter?.trim() ||
      addr.city_district?.trim() ||
      addr.town?.trim() ||
      addr.village?.trim() ||
      addr.county?.trim() ||
      addr.city?.trim()
    const regionPart =
      addr.county?.trim() || addr.city?.trim() || addr.state?.trim() || null
    if (!dong) return null
    return { name: dong, region: regionPart }
  }

  async function fetchFromLocation(): Promise<void> {
    if (!navigator.geolocation) return
    loading.value = true
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })
      const lat = position.coords.latitude
      const lng = position.coords.longitude
      lastLocation.value = { lat, lng }
      const result = await reverseGeocode(lat, lng)
      if (result) {
        name.value = result.name
        region.value = result.region
        // 위치 찾기 결과를 address.ts와 매핑 (동 이름은 그대로, address만 연결)
        const mapped = mapLocationFinderToAddress(result.name)
        if (mapped?.sido && mapped?.gugun) {
          const addr = {
            sido: mapped.sido,
            gugun: mapped.gugun,
            dong: mapped.dong || undefined,
          }
          selectedAddresses.value = [addr]
          myLocationAddress.value = addr
        } else {
          selectedAddresses.value = []
          myLocationAddress.value = null
        }
        try {
          localStorage.setItem(
            'myNeighborhood',
            JSON.stringify({
              name: result.name,
              region: result.region,
              lastLocation: lastLocation.value,
              selectedAddresses: selectedAddresses.value,
              myLocationAddress: myLocationAddress.value,
            })
          )
        } catch {
          // ignore
        }
      } else {
        name.value = null
        region.value = null
        selectedAddresses.value = []
        myLocationAddress.value = null
      }
    } catch {
      name.value = null
      region.value = null
      lastLocation.value = null
      selectedAddresses.value = []
      myLocationAddress.value = null
    } finally {
      loading.value = false
    }
  }

  function clear(): void {
    name.value = null
    region.value = null
    lastLocation.value = null
    selectedAddresses.value = []
    myLocationAddress.value = null
    try {
      localStorage.removeItem('myNeighborhood')
    } catch {
      // ignore
    }
  }

  function setSelectedAddresses(addresses: Array<{ sido: string; gugun: string; dong?: string }>): void {
    selectedAddresses.value = addresses
    try {
      const saved = localStorage.getItem('myNeighborhood')
      const parsed = saved?.trim() ? (JSON.parse(saved) as Record<string, unknown>) : {}
      parsed.selectedAddresses = addresses
      localStorage.setItem('myNeighborhood', JSON.stringify(parsed))
    } catch {
      // ignore
    }
  }

  /** 단일 주소와 동일한 항목이 있으면 제거, 없으면 추가 */
  function toggleSelectedAddress(addr: { sido: string; gugun: string; dong?: string }): void {
    const key = (a: { sido: string; gugun: string; dong?: string }) =>
      `${a.sido}|${a.gugun}|${a.dong ?? ''}`
    const targetKey = key(addr)
    const next = selectedAddresses.value.filter((a) => key(a) !== targetKey)
    if (next.length === selectedAddresses.value.length) {
      next.push(addr)
    }
    setSelectedAddresses(next)
  }

  /** 현재 (sido, gugun, dongLabel)이 선택 목록에 있는지. dongLabel이 "XX 전체"면 dong 없음으로 비교 */
  function isAddressSelected(sido: string, gugun: string, dongLabel: string): boolean {
    const dong = dongLabel.endsWith('전체') ? undefined : dongLabel
    return selectedAddresses.value.some(
      (a) => a.sido === sido && a.gugun === gugun && (a.dong ?? '') === (dong ?? '')
    )
  }

  /** 내 동네 지정 해제 (myLocationAddress 제거 + selectedAddresses에서 해당 주소 제거) */
  function clearMyLocationAddress(): void {
    const my = myLocationAddress.value
    if (!my) return
    const key = (a: { sido: string; gugun: string; dong?: string }) =>
      `${a.sido}|${a.gugun}|${a.dong ?? ''}`
    const myKey = key(my)
    const next = selectedAddresses.value.filter((a) => key(a) !== myKey)
    setSelectedAddresses(next)
    myLocationAddress.value = null
    name.value = null
    region.value = null
    try {
      const saved = localStorage.getItem('myNeighborhood')
      const parsed = saved?.trim() ? (JSON.parse(saved) as Record<string, unknown>) : {}
      parsed.myLocationAddress = null
      parsed.name = null
      parsed.region = null
      parsed.selectedAddresses = selectedAddresses.value
      localStorage.setItem('myNeighborhood', JSON.stringify(parsed))
    } catch {
      // ignore
    }
  }

  /** 동네 찾기 요약 문구 (헤더 표시용). 없으면 null */
  const selectedAddressSummary = computed(() => {
    const list = selectedAddresses.value
    if (!list.length) return null
    const first = list[0]
    const sameGugun = list.every((a) => a.sido === first.sido && a.gugun === first.gugun)
    if (sameGugun && list.length === 1 && first.dong) {
      return `${first.sido} ${first.gugun} ${first.dong}`
    }
    if (sameGugun) {
      return `${first.sido} ${first.gugun} (${list.length}개 동)`
    }
    return `${list.length}개 지역`
  })

  /** 앱 로드 시 localStorage에 저장된 동네가 있으면 복원 */
  function restoreFromStorage(): void {
    try {
      const saved = localStorage.getItem('myNeighborhood')
      if (!saved?.trim()) return
      const parsed = JSON.parse(saved) as {
        name?: string
        region?: string | null
        lastLocation?: { lat: number; lng: number } | null
        selectedAddress?: { sido: string; gugun: string; dong?: string } | null
        selectedAddresses?: Array<{ sido: string; gugun: string; dong?: string }>
        myLocationAddress?: { sido: string; gugun: string; dong?: string } | null
      }
      if (parsed.myLocationAddress && typeof parsed.myLocationAddress.sido === 'string' && typeof parsed.myLocationAddress.gugun === 'string') {
        myLocationAddress.value = {
          sido: parsed.myLocationAddress.sido,
          gugun: parsed.myLocationAddress.gugun,
          dong: parsed.myLocationAddress.dong,
        }
      } else {
        myLocationAddress.value = null
      }
      if (parsed.name?.trim()) {
        name.value = parsed.name.trim()
        region.value = parsed.region?.trim() ?? null
        if (
          parsed.lastLocation &&
          typeof parsed.lastLocation.lat === 'number' &&
          typeof parsed.lastLocation.lng === 'number'
        ) {
          lastLocation.value = {
            lat: parsed.lastLocation.lat,
            lng: parsed.lastLocation.lng,
          }
        }
      }
      if (Array.isArray(parsed.selectedAddresses)) {
        selectedAddresses.value = parsed.selectedAddresses.filter(
          (a): a is { sido: string; gugun: string; dong?: string } =>
            typeof a?.sido === 'string' && typeof a?.gugun === 'string'
        )
        // 저장된 myLocationAddress가 없고, name(GPS)이 있고 선택이 1개면 그 주소를 내 위치로 복원
        if (!parsed.myLocationAddress && parsed.name?.trim() && selectedAddresses.value.length === 1) {
          myLocationAddress.value = { ...selectedAddresses.value[0] }
        }
      } else if (
        parsed.selectedAddress &&
        typeof parsed.selectedAddress.sido === 'string' &&
        typeof parsed.selectedAddress.gugun === 'string'
      ) {
        selectedAddresses.value = [
          {
            sido: parsed.selectedAddress.sido,
            gugun: parsed.selectedAddress.gugun,
            dong: parsed.selectedAddress.dong,
          },
        ]
      }
    } catch {
      // ignore
    }
  }

  return {
    name,
    region,
    loading,
    requestShowMyLocation,
    requestFitMapToSelectedAddress,
    lastLocation,
    showLocationSelectModal,
    selectedAddresses,
    myLocationAddress,
    selectedAddressSummary,
    setSelectedAddresses,
    toggleSelectedAddress,
    isAddressSelected,
    fetchFromLocation,
    clearMyLocationAddress,
    clear,
    restoreFromStorage,
  }
})
