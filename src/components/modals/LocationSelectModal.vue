<template>
  <ModalSmall
    :model-value="modelValue"
    title="동네 찾기"
    :show-footer="true"
    cancel-text="취소"
    confirm-text="동네 찾기"
    @update:model-value="$emit('update:modelValue', $event)"
    @cancel="onMap"
    @confirm="onApply"
  >
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
            :class="{ selected: isDongChecked(d) }"
          >
            <input
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
  </ModalSmall>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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
  white-space: normal; /* .btn의 white-space: nowrap 덮어씀 */
  align-items: flex-start; /* 줄이 여러 개일 때 체크박스 위쪽 정렬 */
}

.location-label {
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: break-word;
}
</style>
