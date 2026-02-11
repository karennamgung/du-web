<template>
  <div class="onboarding-step">
    <h1 class="step-title">돼지언니와 처음 만나셨네요. 환영해요.</h1>
    <p class="step-description">어떤 유형인지 알려주세요.</p>

    <div class="user-type-options">
      <button
        type="button"
        class="user-type-card"
        :class="{ active: selectedType === 'parent' }"
        @click="selectType('parent')"
      >
        <div class="user-type-icon">👨‍👩‍👧</div>
        <h3>학부모</h3>
        <p>자녀의 교육을 위해 찾아오셨나요?</p>
      </button>

      <button
        type="button"
        class="user-type-card"
        :class="{ active: selectedType === 'student' }"
        @click="selectType('student')"
      >
        <div class="user-type-icon">🎓</div>
        <h3>학생</h3>
        <p>직접 교육 정보를 찾고 계신가요?</p>
      </button>

      <button
        type="button"
        class="user-type-card"
        :class="{ active: selectedType === 'academy' }"
        @click="selectType('academy')"
      >
        <div class="user-type-icon">🏫</div>
        <h3>학원</h3>
        <p>학원을 등록하고 관리하시나요?</p>
      </button>
    </div>

    <button
      type="button"
      class="btn btn-primary w-full mt-xl"
      :disabled="!selectedType"
      @click="handleNext"
    >
      다음
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

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

const selectedType = ref<'parent' | 'student' | 'academy' | null>(props.onboardingData.userType)

watch(selectedType, () => {
  emit('update-data', { userType: selectedType.value })
})

function selectType(type: 'parent' | 'student' | 'academy') {
  selectedType.value = type
}

function handleNext() {
  if (selectedType.value) {
    emit('next')
  }
}
</script>

<style lang="scss" scoped>
.onboarding-step {
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.step-title {
  @include v.text-heading-lg;
  margin: 0;
}

.step-description {
  @include v.text-body;
  color: v.$color-text-dim;
  margin: 0;
}

.user-type-options {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
}

.user-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: v.$space-sm;
  padding: v.$space-xl;
  background-color: v.$color-bg-base;
  border: 2px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  cursor: pointer;
  transition: all v.$transition-base;

  &:hover {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
  }

  &.active {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
    box-shadow: 0 0 0 2px v.$color-primary-dimmer;
  }

  h3 {
    @include v.text-heading-md;
    margin: 0;
  }

  p {
    @include v.text-caption-sm;
    margin: 0;
    text-align: center;
  }
}

.user-type-icon {
  font-size: 3rem;
  line-height: 1;
}
</style>
