<template>
  <ModalSmall
    :model-value="modelValue"
    title="동네 찾기"
    :show-footer="true"
    cancel-text="취소"
    confirm-text="학원 보기"
    @update:model-value="$emit('update:modelValue', $event)"
    @cancel="onMap"
    @confirm="onApply"
  >
    <LocationModalBody ref="locationBodyRef" />
  </ModalSmall>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalSmall from '@/components/shared/ModalSmall.vue'
import LocationModalBody from '@/components/modals/LocationModalBody.vue'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'

const router = useRouter()
const myNeighborhood = useMyNeighborhoodStore()
const locationBodyRef = ref<InstanceType<typeof LocationModalBody> | null>(null)

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; apply: [] }>()

watch(
  () => props.modelValue,
  (open) => {
    if (open) locationBodyRef.value?.syncFromStore()
  },
  { immediate: true }
)

function onMap() {
  emit('update:modelValue', false)
  router.push('/')
}

function onApply() {
  myNeighborhood.requestFitMapToSelectedAddress = true
  emit('apply')
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
/* 스타일은 LocationModalBody로 이전됨 */
</style>
