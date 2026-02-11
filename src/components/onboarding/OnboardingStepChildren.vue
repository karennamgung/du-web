<template>
  <div class="onboarding-step">
    <h1 class="step-title">아이를 등록해주세요</h1>
    <p class="step-description">맞춤형 교육 정보를 제공하기 위해 아이 정보가 필요해요.</p>

    <div class="children-list">
      <div
        v-for="(child, index) in children"
        :key="index"
        class="child-card"
      >
        <div class="child-header">
          <h3>{{ getChildLabel(index) }}</h3>
          <button
            type="button"
            class="btn btn-ghost btn-small"
            @click="removeChild(index)"
          >
            삭제
          </button>
        </div>
        <div class="child-form">
          <div class="input-group">
            <label>아이 이름</label>
            <input
              v-model="child.name"
              type="text"
              placeholder="이름을 입력해주세요"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>나이</label>
            <input
              :model-value="child.age"
              type="number"
              placeholder="예: 10"
              class="input"
              min="0"
              max="100"
              @input="(e) => (child.age = Math.max(0, Math.min(100, Number((e.target as HTMLInputElement).value) || 0)))"
            />
          </div>
          <div class="input-group">
            <label>성별</label>
            <div class="radio-selector-group">
              <label class="radio-selector radio-selector--with-label">
                <span class="radio-selector__circle">
                  <input
                    type="radio"
                    class="radio-selector__input"
                    :name="`onboarding-gender-${index}`"
                    value="male"
                    :checked="child.gender === 'male'"
                    @change="child.gender = 'male'"
                  />
                  <span class="radio-selector__dot" aria-hidden="true" />
                </span>
                <span class="radio-selector__label">남아</span>
              </label>
              <label class="radio-selector radio-selector--with-label">
                <span class="radio-selector__circle">
                  <input
                    type="radio"
                    class="radio-selector__input"
                    :name="`onboarding-gender-${index}`"
                    value="female"
                    :checked="child.gender === 'female'"
                    @change="child.gender = 'female'"
                  />
                  <span class="radio-selector__dot" aria-hidden="true" />
                </span>
                <span class="radio-selector__label">여아</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="btn btn-outline w-full"
      @click="addChild"
    >
      + 아이 추가하기
    </button>

    <button
      type="button"
      class="btn btn-outline w-full mt-md"
      @click="handleNoChildren"
    >
      무자녀
    </button>

    <button
      type="button"
      class="btn btn-primary w-full mt-xl"
      @click="handleNext"
    >
      완료
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getChildOrderLabel } from '@/stores/profile'

interface Child {
  name: string
  age: number
  gender: 'male' | 'female' | null
}

interface Props {
  onboardingData: {
    children: Child[]
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { children: Child[] }]
  complete: []
}>()

const children = ref<Child[]>(
  props.onboardingData.children.length > 0
    ? [...props.onboardingData.children]
    : [
        {
          name: '',
          age: 10,
          gender: null,
        },
      ]
)

function getChildLabel(index: number): string {
  return getChildOrderLabel(index)
}

function addChild() {
  children.value.push({
    name: '',
    age: 10,
    gender: null,
  })
  emit('update-data', { children: children.value })
}

function removeChild(index: number) {
  children.value.splice(index, 1)
  if (children.value.length === 0) {
    addChild()
  }
  emit('update-data', { children: children.value })
}

function handleNoChildren() {
  children.value = []
  emit('update-data', { children: [] })
  emit('complete')
}

function handleNext() {
  console.log('[OnboardingStepChildren] 완료 버튼 클릭')
  // 빈 아이 정보 필터링
  const validChildren = children.value.filter((child) => child.name.trim().length > 0)
  console.log('[OnboardingStepChildren] 유효한 아이 수:', validChildren.length)
  emit('update-data', { children: validChildren })
  // 완료 이벤트 발생 (온보딩 전체 완료)
  emit('complete')
}

watch(
  children,
  () => {
    emit('update-data', { children: children.value })
  },
  { deep: true }
)
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

.children-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.child-card {
  padding: v.$space-lg;
  background-color: v.$color-bg-dim;
  border-radius: v.$radius-md;
}

.child-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: v.$space-md;

  h3 {
    @include v.text-heading-sm;
    margin: 0;
  }
}

.child-form {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;

  label {
    @include v.text-heading-sm;
  }

  .input {
    @include v.input-base;
  }
}

</style>
