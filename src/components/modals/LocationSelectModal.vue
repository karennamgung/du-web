<template>
  <ModalSmall
    :model-value="modelValue"
    title="위치 기준"
    :show-footer="true"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="location-select-columns">
      <div class="location-column">
        <ul class="location-list">
          <li
            v-for="s in sidoList"
            :key="s"
            class="location-item"
            :class="{ selected: selectedSido === s }"
            @click="selectedSido = s; selectedGugun = null"
          >
            {{ s }}
          </li>
        </ul>
      </div>
      <div class="location-column">
        <ul class="location-list">
          <li
            v-for="g in gugunList"
            :key="g"
            class="location-item"
            :class="{ selected: selectedGugun === g }"
            @click="selectedGugun = g"
          >
            {{ g }}
          </li>
        </ul>
      </div>
      <div class="location-column">
        <ul class="location-list location-list-dong">
          <li
            v-for="d in dongList"
            :key="d"
            class="location-item location-item-check"
            :class="{ selected: isDongChecked(d) }"
            @click="toggleDong(d)"
          >
            <span class="location-checkbox" :class="{ checked: isDongChecked(d) }" aria-hidden="true" />
            <span class="location-label">{{ d }}</span>
          </li>
        </ul>
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="btn btn-outline"
        @click="onMap"
      >
        지도
      </button>
      <button
        type="button"
        class="btn btn-primary"
        @click="onApply"
      >
        적용
      </button>
    </template>
  </ModalSmall>
</template>

<script setup lang="ts">
import { ref, watch, computed, unref } from 'vue'
import { useRouter } from 'vue-router'
import ModalSmall from '@/components/shared/ModalSmall.vue'
import { SIDO_ORDER, getGugunBySido, getDongBySidoGugun } from '@/constants/address'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'

const router = useRouter()

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; apply: [] }>()

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

// 모달 열릴 때 store의 selectedAddresses에서 첫 항목으로 시/구 컬럼 초기화
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      const addrs = myNeighborhood.selectedAddresses
      if (addrs?.length && addrs[0].sido && addrs[0].gugun) {
        selectedSido.value = addrs[0].sido
        selectedGugun.value = addrs[0].gugun
      } else {
        selectedSido.value = '서울'
        const guguns = getGugunBySido('서울')
        selectedGugun.value = guguns[0] ?? null
      }
    }
  },
  { immediate: true }
)

watch(gugunList, (list) => {
  if (list.length && (!selectedGugun.value || !list.includes(selectedGugun.value))) {
    selectedGugun.value = list[0]
  }
})

function onMap() {
  emit('update:modelValue', false)
  router.push('/')
}

function isDongChecked(dongLabel: string): boolean {
  if (!selectedSido.value || !selectedGugun.value) return false
  return myNeighborhood.isAddressSelected(selectedSido.value, selectedGugun.value, dongLabel)
}

function toggleDong(dongLabel: string) {
  if (!selectedSido.value || !selectedGugun.value) return
  const dong = dongLabel.endsWith('전체') ? undefined : dongLabel
  myNeighborhood.toggleSelectedAddress({
    sido: selectedSido.value,
    gugun: selectedGugun.value,
    ...(dong ? { dong } : {}),
  })
}

function onApply() {
  myNeighborhood.requestFitMapToSelectedAddress = true
  emit('apply')
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.location-select-columns {
  display: flex;
  gap: 0;
  min-height: 240px;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  overflow: hidden;
}

.location-column {
  flex: 1;
  min-width: 0;
  border-right: 1px solid v.$color-border-dim;
  overflow-y: auto;

  &:last-child {
    border-right: none;
  }
}

.location-list {
  list-style: none;
  margin: 0;
  padding: v.$space-xs 0;
}

.location-item {
  padding: v.$space-sm v.$space-md;
  cursor: pointer;
  font-size: 0.9375rem;
  color: v.$color-text-dim;

  &:hover {
    background: v.$color-bg-dim;
  }

  &.selected {
    background: v.$color-bg-dim;
    color: v.$color-primary;
    font-weight: 600;
  }
}

.location-item-check {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
}

.location-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid v.$color-border-dim;
  border-radius: 3px;
  background: v.$color-bg-base;
  font-size: 0.75rem;
  color: #fff;

  .location-item.selected &,
  &.checked {
    background: v.$color-primary;
    border-color: v.$color-primary;
  }

  .location-item.selected &::after,
  &.checked::after {
    content: '✓';
  }
}

.location-label {
  flex: 1;
  min-width: 0;
}
</style>
