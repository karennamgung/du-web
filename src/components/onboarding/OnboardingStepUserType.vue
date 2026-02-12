<template>
  <div class="user-type-options">
    <button
      v-for="opt in userTypeOptions"
      :key="opt.type"
      type="button"
      class="user-type-card"
      :class="{ active: selectedType === opt.type }"
      @click="selectType(opt.type)"
    >
      <div class="user-type-card__body">
        <div class="user-type-card__icon mb-sm">{{ opt.icon }}</div>
        <h4>{{ opt.title }}</h4>
        <p>{{ opt.desc }}</p>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { USER_TYPE_LABELS } from '@/stores/profile'

interface Props {
  onboardingData: {
    userType: 'parent' | 'student' | 'academy' | null
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { userType: 'parent' | 'student' | 'academy' | null }]
  next: []
}>()

type UserType = 'parent' | 'student' | 'academy'

const userTypeOptions: { type: UserType; title: string; icon: string; desc: string }[] = [
  { type: 'parent', title: USER_TYPE_LABELS.parent, icon: '👨‍👩‍👧', desc: '자녀의 교육을 위해 찾고싶어요' },
  { type: 'student', title: USER_TYPE_LABELS.student, icon: '🎓', desc: '직접 교육 정보를 찾고있어요' },
  { type: 'academy', title: USER_TYPE_LABELS.academy, icon: '🏫', desc: '학원을 등록하고 관리하고 싶어요' },
]

const selectedType = ref<UserType | null>(props.onboardingData.userType)

watch(selectedType, () => {
  emit('update-data', { userType: selectedType.value })
})

function selectType(type: UserType) {
  selectedType.value = type
}

const canProceed = computed(() => !!selectedType.value)

function requestNext() {
  if (selectedType.value) {
    emit('next')
  }
}

defineExpose({
  requestNext,
  canProceed,
})
</script>

<style lang="scss" scoped>
.user-type-options {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
}

.user-type-card {
  display: block;
  width: 100%;
  text-align: left;
  border: 2px solid transparent;
  border-radius: v.$radius-md;
  padding: v.$space-lg;
  cursor: pointer;
  background: none;
  background-color: v.$color-bg-dimmer;
  transition: border-color v.$transition-fast, background-color v.$transition-fast;
  gap: v.$space-sm;

  &:hover {
      background-color: v.$color-bg-dim;
  }

  &.active {
    border-color: v.$color-border-stronger;
  }
}

.user-type-card__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-type-card__icon {
  font-size: 2.5rem;
  line-height: 1;
}
</style>
