<template>
  <ModalSmall v-model="isOpen" title="로그인" @update:modelValue="handleUpdate">
    <LoginView :academy-id="academyId" @close="close" />
  </ModalSmall>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModalSmall from '@/components/shared/ModalSmall.vue'
import LoginView from '@/views/LoginView.vue'

const props = defineProps<{
  modelValue: boolean
  academyId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function handleUpdate(value: boolean) {
  emit('update:modelValue', value)
}

function close() {
  emit('update:modelValue', false)
}
</script>
