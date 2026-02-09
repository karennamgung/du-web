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
            <label>출생년도</label>
            <input
              v-model.number="child.birthYear"
              type="number"
              placeholder="예: 2015"
              class="input"
              min="2000"
              :max="currentYear"
            />
          </div>
          <div class="input-group">
            <label>재원중인 교육기관</label>
            <input
              v-model="child.educationInstitution"
              type="text"
              placeholder="예: OO초등학교 (선택사항)"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>성별</label>
            <div class="gender-options">
              <button
                type="button"
                class="gender-btn"
                :class="{ active: child.gender === 'male' }"
                @click="child.gender = 'male'"
              >
                남자
              </button>
              <button
                type="button"
                class="gender-btn"
                :class="{ active: child.gender === 'female' }"
                @click="child.gender = 'female'"
              >
                여자
              </button>
              <button
                type="button"
                class="gender-btn"
                :class="{ active: child.gender === null }"
                @click="child.gender = null"
              >
                선택안함
              </button>
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
import { ref, computed, watch } from 'vue'

interface Child {
  name: string
  birthYear: number
  educationInstitution: string | null
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
          birthYear: new Date().getFullYear() - 10,
          educationInstitution: null,
          gender: null,
        },
      ]
)

const currentYear = computed(() => new Date().getFullYear())

const childLabels = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째']

function getChildLabel(index: number): string {
  return `${childLabels[index] || `${index + 1}번째`}아이`
}

function addChild() {
  children.value.push({
    name: '',
    birthYear: new Date().getFullYear() - 10,
    educationInstitution: null,
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
@use '@/assets/styles/index' as v;

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

.gender-options {
  display: flex;
  gap: v.$space-sm;
}

.gender-btn {
  flex: 1;
  padding: v.$space-sm v.$space-md;
  border: 2px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  background-color: v.$color-bg-base;
  color: v.$color-text-base;
  cursor: pointer;
  transition: all v.$transition-base;

  &:hover {
    border-color: v.$color-primary;
  }

  &.active {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
    color: v.$color-primary;
    font-weight: v.$font-weight-semibold;
  }
}
</style>
