<template>
  <ModalSmall v-model="isOpen" :title="modalTitle" @update:modelValue="handleUpdate">
    <!-- 프로필(자녀) 선택: 학부모이고 자녀가 있을 때만 -->
    <div
      v-if="profileStore.profile?.user_type === 'parent' && profileStore.children.length"
      class="profile-modal-section"
    >
      <p class="profile-modal-heading">프로필</p>
      <div class="profile-modal-chips">
        <button
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedChildIndex === null }"
          @click="profileStore.selectChild(null)"
        >
          전체
        </button>
        <button
          v-for="(_, idx) in profileStore.children"
          :key="idx"
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedChildIndex === idx }"
          @click="profileStore.selectChild(idx)"
        >
          {{ getChildOrderLabel(idx) }}
        </button>
      </div>
    </div>
    <!-- 연령 선택 (지도 필터용) -->
    <div class="profile-modal-section">
      <p class="profile-modal-heading">연령</p>
      <div class="profile-modal-chips">
        <button
          v-for="opt in AGE_GROUP_ORDER"
          :key="'age-' + opt"
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedAgeGroupsForMap.includes(opt) }"
          @click="profileStore.toggleAgeGroupForMap(opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>
    <ProfileInfoView />
  </ModalSmall>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ModalSmall from '@/components/shared/ModalSmall.vue'
import ProfileInfoView from '@/views/ProfileInfoView.vue'
import { useProfileStore, getChildOrderLabel } from '@/stores/profile'
import { AGE_GROUP_ORDER } from '@/constants/subjectTypes'

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
    return '프로필 선택하기'
  } else if (profileStore.profile?.user_type === 'student') {
    return '프로필'
  }
  return '프로필'
})

function handleUpdate(value: boolean) {
  emit('update:modelValue', value)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/index' as vars;

.profile-modal-section {
  margin-bottom: vars.$space-md;

  &:last-of-type {
    margin-bottom: vars.$space-lg;
  }
}

.profile-modal-heading {
  margin: 0 0 vars.$space-xs;
  font-size: 0.75rem;
  font-weight: 600;
  color: vars.$color-text-dim;
}

.profile-modal-chips {
  display: flex;
  flex-wrap: wrap;
  gap: vars.$space-xs;
}
</style>
