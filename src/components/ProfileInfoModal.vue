<template>
  <ModalSmall v-model="isOpen" :title="modalTitle" @update:modelValue="handleUpdate">
    <ProfileInfoView />
  </ModalSmall>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModalSmall from '@/components/ModalSmall.vue'
import ProfileInfoView from '@/views/ProfileInfoView.vue'
import { useProfileStore } from '@/stores/profile'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const profileStore = useProfileStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const modalTitle = computed(() => {
  if (profileStore.profile?.user_type === 'parent') {
    return '사용자 선택'
  } else if (profileStore.profile?.user_type === 'student') {
    return '내 정보'
  }
  return '프로필'
})

function handleUpdate(value: boolean) {
  emit('update:modelValue', value)
}
</script>
