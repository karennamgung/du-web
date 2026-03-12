<template>
  <div class="location-modal-body">
    <div class="location-modal-my-location">
      <button
        type="button"
        class="btn link"
        :disabled="myNeighborhood.loading"
        @click="onMyLocation"
      >
        {{ myNeighborhood.loading ? '가져오는 중…' : '내 동네' }}
      </button>
      <span
        v-if="myNeighborhood.myLocationAddress"
        class="location-my-tag-wrap"
      >
        <span class="tag tag-small type-size-xs tag-secondary">
          {{ myNeighborhood.myLocationAddress.dong ?? myNeighborhood.myLocationAddress.gugun }}
        </span>
        <button
          type="button"
          class="btn btn-ghost btn-icon btn-small location-my-tag-close"
          aria-label="내 동네 해제"
          @click="myNeighborhood.clearMyLocationAddress()"
        >
          <Icon class="icon-2xs color-dim" :path="mdiClose" />
        </button>
      </span>
    </div>
    <div v-if="otherAddressChips.length" class="location-modal-other-chips">
      <span
        v-for="addr in otherAddressChips"
        :key="`${addr.sido}|${addr.gugun}|${addr.dong ?? ''}`"
        class="tag tag-small type-size-xs tag-primary"
      >
        {{ addr.label }}
      </span>
    </div>
    <div class="location-select-columns">
      <div class="location-column">
        <div class="location-list">
          <button
            v-for="s in sidoList"
            :key="s"
            type="button"
            class="btn btn-ghost"
            :class="{ selected: selectedSido === s }"
            @click="selectedSido = s; selectedGugun = null"
          >
            {{ s }}
          </button>
        </div>
      </div>
      <div class="location-column">
        <div class="location-list">
          <button
            v-for="g in gugunList"
            :key="g"
            type="button"
            class="btn btn-ghost"
            :class="{ selected: selectedGugun === g }"
            @click="selectedGugun = g"
          >
            {{ g }}
          </button>
        </div>
      </div>
      <div class="location-column">
        <div class="location-list">
          <label
            v-for="d in dongList"
            :key="d"
            class="input-checkbox-label btn btn-ghost"
            :class="{ selected: isDongChecked(d), 'location-dong-disabled': isMyLocationDong(d) }"
          >
            <template v-if="isMyLocationDong(d)">
              <span class="location-dong-icon-slot mt-xs" aria-hidden="true">
                <Icon class="icon-sm color-success" :path="mdiMapMarker" />
              </span>
            </template>
            <input
              v-else
              type="checkbox"
              class="mt-xs"
              :checked="isDongChecked(d)"
              :aria-label="d"
              @change="toggleDong(d)"
            />
            <span class="location-label">{{ d }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Icon from '@/components/shared/Icon.vue'
import { SIDO_ORDER, getGugunBySido, getDongBySidoGugun } from '@/constants/address'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import { mdiMapMarker, mdiClose } from '@mdi/js'

const myNeighborhood = useMyNeighborhoodStore()

const selectedSido = ref<string>('서울')
const selectedGugun = ref<string | null>(null)

const sidoList = computed(() => [...SIDO_ORDER])

const gugunList = computed(() => {
  if (!selectedSido.value) return []
  return getGugunBySido(selectedSido.value)
})

const dongList = computed(() => {
  if (!selectedSido.value || !selectedGugun.value) return []
  return getDongBySidoGugun(selectedSido.value, selectedGugun.value)
})

const addrKey = (a: { sido: string; gugun: string; dong?: string }) =>
  `${a.sido}|${a.gugun}|${a.dong ?? ''}`

const otherAddressChips = computed(() => {
  const my = myNeighborhood.myLocationAddress
  const key = my ? addrKey(my) : null
  return myNeighborhood.selectedAddresses
    .filter((a) => addrKey(a) !== key)
    .map((a) => ({ ...a, label: a.dong ?? a.gugun }))
})

defineExpose({
  /** 패널이 열릴 때 호출해 시/구 컬럼을 선택된 주소에 맞게 초기화 */
  syncFromStore() {
    const addrs = myNeighborhood.selectedAddresses
    if (addrs?.length && addrs[0].sido && addrs[0].gugun) {
      selectedSido.value = addrs[0].sido
      selectedGugun.value = addrs[0].gugun
    } else {
      selectedSido.value = '서울'
      const guguns = getGugunBySido('서울')
      selectedGugun.value = guguns[0] ?? null
    }
  },
})

watch(gugunList, (list) => {
  if (list.length && (!selectedGugun.value || !list.includes(selectedGugun.value))) {
    selectedGugun.value = list[0]
  }
})

function isDongChecked(dongLabel: string): boolean {
  if (!selectedSido.value || !selectedGugun.value) return false
  return myNeighborhood.isAddressSelected(selectedSido.value, selectedGugun.value, dongLabel)
}

function isMyLocationDong(dongLabel: string): boolean {
  const my = myNeighborhood.myLocationAddress
  if (!my || !selectedSido.value || !selectedGugun.value) return false
  if (my.sido !== selectedSido.value || my.gugun !== selectedGugun.value) return false
  const myLabel = my.dong ?? `${selectedGugun.value} 전체`
  return dongLabel === myLabel
}

function toggleDong(dongLabel: string) {
  if (!selectedSido.value || !selectedGugun.value) return
  if (isMyLocationDong(dongLabel)) return
  const sido = selectedSido.value
  const gugun = selectedGugun.value
  const isWhole = dongLabel.endsWith('전체')

  if (isWhole) {
    const wholeChecked = myNeighborhood.isAddressSelected(sido, gugun, dongLabel)
    const rest = myNeighborhood.selectedAddresses.filter(
      (a) => a.sido !== sido || a.gugun !== gugun
    )
    if (!wholeChecked) {
      const dongs = dongList.value.filter((d) => !d.endsWith('전체'))
      const newAddrs = [
        { sido, gugun, dong: undefined as string | undefined },
        ...dongs.map((d) => ({ sido, gugun, dong: d })),
      ]
      myNeighborhood.setSelectedAddresses([...rest, ...newAddrs])
    } else {
      const my = myNeighborhood.myLocationAddress
      const next =
        my && my.sido === sido && my.gugun === gugun
          ? [...rest, { sido: my.sido, gugun: my.gugun, dong: my.dong }]
          : rest
      myNeighborhood.setSelectedAddresses(next)
    }
  } else {
    const dong = dongLabel
    const wasSelected = myNeighborhood.isAddressSelected(sido, gugun, dong)
    myNeighborhood.toggleSelectedAddress({ sido, gugun, dong })
    if (wasSelected) {
      const next = myNeighborhood.selectedAddresses.filter(
        (a) => !(a.sido === sido && a.gugun === gugun && a.dong === undefined)
      )
      myNeighborhood.setSelectedAddresses(next)
    } else {
      const dongs = dongList.value.filter((d) => !d.endsWith('전체'))
      const allDongsSelected =
        dongs.length > 0 &&
        dongs.every((d) => myNeighborhood.isAddressSelected(sido, gugun, d))
      const wholeAlreadySelected = myNeighborhood.isAddressSelected(
        sido,
        gugun,
        `${gugun} 전체`
      )
      if (allDongsSelected && !wholeAlreadySelected) {
        myNeighborhood.toggleSelectedAddress({ sido, gugun, dong: undefined })
      }
    }
  }
}

async function onMyLocation() {
  await myNeighborhood.fetchFromLocation()
  const addrs = myNeighborhood.selectedAddresses
  if (addrs?.length && addrs[0].sido && addrs[0].gugun) {
    selectedSido.value = addrs[0].sido
    selectedGugun.value = addrs[0].gugun
  }
}
</script>

<style lang="scss" scoped>
.location-modal-my-location {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
  flex-wrap: wrap;
  margin-bottom: v.$space-sm;
}

.location-my-tag-wrap {
  display: inline-flex;
  align-items: center;
  gap: v.$space-2xs;
}

.location-my-tag-close {
  padding: v.$space-2xs;
  min-width: 0;
  min-height: 0;
}

.location-modal-other-chips {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
  flex-wrap: wrap;
  margin-bottom: v.$space-md;
}

.location-select-columns {
  display: flex;
  gap: v.$space-sm;
  min-height: 15rem;
  border-radius: v.$radius-md;
  overflow: hidden;
}

.location-column {
  flex: 1;
  min-width: 0;
  overflow-y: auto;

  &:last-child {
    border-right: none;
  }
}

.location-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;
  margin: 0;
}

.location-list > .btn,
.location-list > .input-checkbox-label {
  width: 100%;
  justify-content: flex-start;
  color: v.$color-text-dim;

  &.selected {
    background: v.$color-bg-dimmer;
    color: v.$color-text-base;
  }
}

.location-list > .input-checkbox-label {
  white-space: normal;
  align-items: flex-start;
}

.location-label {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}

.location-dong-disabled {
  cursor: default;
  opacity: 0.9;
}

.location-dong-icon-slot {
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
