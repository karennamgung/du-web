import { defineStore } from 'pinia'
import { ref } from 'vue'

/** OpenStreetMap Nominatim (브라우저 CORS 허용, API 키 불필요) */
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'

/** 내 동네 경계 (bbox). 학원은 주소가 아니라 이 범위 안에 있으면 표시 */
export type NeighborhoodBoundary = { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }

export const useMyNeighborhoodStore = defineStore('myNeighborhood', () => {
  /** 동 이름 (읍/면/동 또는 시/군/구) — 표시용 */
  const name = ref<string | null>(null)
  /** 시·구 등 지역 — 표시용 */
  const region = ref<string | null>(null)
  /** 내 동네 경계(bbox). 이 범위 안에 있는 학원만 리스트에 표시 (도로명/동 이름 무관) */
  const boundary = ref<NeighborhoodBoundary | null>(null)
  const loading = ref(false)
  /** 지도에 내 위치 표시 요청 (위치 찾기 클릭 시 true → MapPageView에서 showMyLocation 호출 후 false) */
  const requestShowMyLocation = ref(false)
  /** 마지막으로 확인한 내 위치 (지도 복귀 시 마커 복원용) */
  const lastLocation = ref<{ lat: number; lng: number } | null>(null)

  /** 역지오코딩: 위경도 → 주소(동 + 시·구) + boundingbox. Nominatim 사용 (CORS 허용). 한국어 주소 요청 */
  async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; region: string | null; boundary: NeighborhoodBoundary } | null> {
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
      /** [min_lat, max_lat, min_lon, max_lon] */
      boundingbox?: string[]
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
    // Nominatim boundingbox: [min_lat, max_lat, min_lon, max_lon]
    const bbox = data.boundingbox
    let boundaryVal: NeighborhoodBoundary | null = null
    if (Array.isArray(bbox) && bbox.length >= 4) {
      const minLat = parseFloat(bbox[0])
      const maxLat = parseFloat(bbox[1])
      const minLon = parseFloat(bbox[2])
      const maxLon = parseFloat(bbox[3])
      if (!Number.isNaN(minLat) && !Number.isNaN(maxLat) && !Number.isNaN(minLon) && !Number.isNaN(maxLon)) {
        boundaryVal = { sw: { lat: minLat, lng: minLon }, ne: { lat: maxLat, lng: maxLon } }
      }
    }
    // bbox 없으면 사용자 위치 기준 약 2km 범위를 기본 boundary로 사용
    const delta = 0.02
    const fallbackBoundary: NeighborhoodBoundary = boundaryVal ?? {
      sw: { lat: lat - delta, lng: lng - delta },
      ne: { lat: lat + delta, lng: lng + delta },
    }
    return { name: dong, region: regionPart, boundary: fallbackBoundary }
  }

  /** 동 이름 + 지역으로 검색해 해당 "동" 전체 행정구역 경계(bbox) 조회 */
  async function fetchBoundaryByPlaceName(
    dongName: string,
    region: string | null
  ): Promise<NeighborhoodBoundary | null> {
    const query = [dongName.trim(), region?.trim(), '대한민국'].filter(Boolean).join(' ')
    if (!query.replace(/대한민국\s*$/, '').trim()) return null
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '10',
      countrycodes: 'kr',
      addressdetails: '0',
    })
    const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
      headers: { 'Accept-Language': 'ko', 'User-Agent': 'DU-Academy-App/1.0' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      type?: string
      class?: string
      boundingbox?: string[]
      lat?: string
      lon?: string
    }>
    if (!Array.isArray(data) || data.length === 0) return null
    const bboxToArea = (bbox: string[]) => {
      if (bbox.length < 4) return 0
      const minLat = parseFloat(bbox[0])
      const maxLat = parseFloat(bbox[1])
      const minLon = parseFloat(bbox[2])
      const maxLon = parseFloat(bbox[3])
      if (Number.isNaN(minLat + maxLat + minLon + maxLon)) return 0
      return (maxLat - minLat) * (maxLon - minLon)
    }
    const adminLikeTypes = new Set([
      'administrative',
      'suburb',
      'neighbourhood',
      'residential',
      'village',
      'town',
      'quarter',
      'district',
      'city_block',
    ])
    let best: { bbox: string[]; score: number } | null = null
    for (const item of data) {
      if (!item) continue
      const bbox = item.boundingbox
      if (!Array.isArray(bbox) || bbox.length < 4) continue
      const area = bboxToArea(bbox)
      if (area < 1e-10) continue
      const minLat = parseFloat(bbox[0])
      const maxLat = parseFloat(bbox[1])
      const minLon = parseFloat(bbox[2])
      const maxLon = parseFloat(bbox[3])
      if (Number.isNaN(minLat + maxLat + minLon + maxLon)) continue
      const type = (item.type ?? item.class ?? '').toLowerCase()
      const isAdminLike = adminLikeTypes.has(type) || type.includes('admin') || type.includes('district')
      const score = (isAdminLike ? 1e6 : 0) + area
      if (!best || score > best.score) best = { bbox, score }
    }
    if (!best) return null
    const [minLat, maxLat, minLon, maxLon] = best.bbox.map(Number)
    return { sw: { lat: minLat, lng: minLon }, ne: { lat: maxLat, lng: maxLon } }
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
        const dongBoundary = await fetchBoundaryByPlaceName(result.name, result.region)
        boundary.value = dongBoundary ?? result.boundary
        try {
          localStorage.setItem(
            'myNeighborhood',
            JSON.stringify({ name: result.name, region: result.region, boundary: boundary.value, lastLocation: lastLocation.value })
          )
        } catch {
          // ignore
        }
      } else {
        name.value = null
        region.value = null
        boundary.value = null
      }
    } catch {
      name.value = null
      region.value = null
      boundary.value = null
      lastLocation.value = null
    } finally {
      loading.value = false
    }
  }

  function clear(): void {
    name.value = null
    region.value = null
    boundary.value = null
    lastLocation.value = null
    try {
      localStorage.removeItem('myNeighborhood')
    } catch {
      // ignore
    }
  }

  /** 앱 로드 시 localStorage에 저장된 동네가 있으면 복원 */
  function restoreFromStorage(): void {
    if (name.value) return
    try {
      const saved = localStorage.getItem('myNeighborhood')
      if (!saved?.trim()) return
      try {
        const parsed = JSON.parse(saved) as {
          name?: string
          region?: string | null
          boundary?: NeighborhoodBoundary | null
          lastLocation?: { lat: number; lng: number } | null
        }
        if (parsed.name?.trim()) {
          name.value = parsed.name.trim()
          region.value = parsed.region?.trim() ?? null
          boundary.value =
            parsed.boundary &&
            typeof parsed.boundary.sw?.lat === 'number' &&
            typeof parsed.boundary.ne?.lat === 'number'
              ? parsed.boundary
              : null
          if (parsed.lastLocation && typeof parsed.lastLocation.lat === 'number' && typeof parsed.lastLocation.lng === 'number') {
            lastLocation.value = { lat: parsed.lastLocation.lat, lng: parsed.lastLocation.lng }
          } else if (boundary.value) {
            // 예전에 저장된 데이터는 lastLocation이 없을 수 있음 → boundary 중심으로 채워서 지도 마커 복원 가능하게
            lastLocation.value = {
              lat: (boundary.value.sw.lat + boundary.value.ne.lat) / 2,
              lng: (boundary.value.sw.lng + boundary.value.ne.lng) / 2,
            }
          }
        }
      } catch {
        name.value = saved.trim()
        region.value = null
        boundary.value = null
      }
    } catch {
      // ignore
    }
  }

  return {
    name,
    region,
    boundary,
    loading,
    requestShowMyLocation,
    lastLocation,
    fetchFromLocation,
    clear,
    restoreFromStorage,
  }
})
