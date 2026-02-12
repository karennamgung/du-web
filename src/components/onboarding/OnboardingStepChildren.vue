<template>
  <div class="step-body">
    <div class="children-choice" role="radiogroup" aria-label="자녀 등록 여부">
      <div class="children-choice__option children-choice__option--with-body">
        <label class="radio-selector radio-selector--with-label children-choice__label">
          <span class="radio-selector__circle">
            <input
              type="radio"
              class="radio-selector__input"
              name="onboarding-children-choice"
              value="register"
              :checked="choice === 'register'"
              @change="choice = 'register'"
            />
            <span class="radio-selector__dot" aria-hidden="true" />
          </span>
          <span class="radio-selector__label">자녀를 등록합니다</span>
        </label>
        <div v-show="choice === 'register'" class="children-choice__body">
          <div class="children-list">
            <ProfileCard
              v-for="(child, index) in children"
              :key="index"
              variant="child"
              :order-label="getChildLabel(index)"
              :child="child"
              :child-form="child"
              :show-selector="false"
              :show-edit="true"
              :show-delete="index > 0"
              :is-editing="true"
              :can-save-child="true"
              :hide-save-cancel="true"
              with-card-style
              @update:child-form="(f) => Object.assign(child, f)"
              @delete="() => removeChild(index)"
            />
          </div>
          <button
            type="button"
            class="btn btn-gray w-full mt-lg"
            @click="addChild"
          >
            <Icon class="icon-sm" :path="mdiPlus" />
            자녀 추가하기
          </button>
        </div>
      </div>
      <div
        v-for="opt in otherOptions"
        :key="opt.value"
        class="children-choice__option"
      >
        <label class="radio-selector radio-selector--with-label children-choice__label">
          <span class="radio-selector__circle">
            <input
              type="radio"
              class="radio-selector__input"
              name="onboarding-children-choice"
              :value="opt.value"
              :checked="choice === opt.value"
              @change="choice = opt.value"
            />
            <span class="radio-selector__dot" aria-hidden="true" />
          </span>
          <span class="radio-selector__label">{{ opt.label }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/shared/Icon.vue'
import { mdiPlus } from '@mdi/js'
import { ref, computed, watch } from 'vue'
import { getChildOrderLabel } from '@/stores/profile'
import ProfileCard from '@/components/profile/ProfileCard.vue'

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
  'update:canProceed': [value: boolean]
  complete: []
}>()

type ChildrenChoice = 'register' | 'no_children' | 'later'

const childrenOptions: { value: ChildrenChoice; label: string }[] = [
  { value: 'register', label: '자녀를 등록합니다' },
  { value: 'no_children', label: '무자녀 입니다' },
  { value: 'later', label: '다음에 등록할게요' },
]
const otherOptions = childrenOptions.filter((o) => o.value !== 'register')

const choice = ref<ChildrenChoice>('register')

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

function isChildComplete(child: Child): boolean {
  return (
    child.name.trim().length > 0 &&
    (child.gender === 'male' || child.gender === 'female')
  )
}

const canProceed = computed(() => {
  if (choice.value !== 'register') return true
  if (children.value.length === 0) return false
  return children.value.every(isChildComplete)
})

watch(
  [choice, children],
  () => emit('update:canProceed', canProceed.value),
  { immediate: true, deep: true },
)

function requestNext() {
  if (choice.value === 'register') {
    const validChildren = children.value.filter((child) => child.name.trim().length > 0)
    emit('update-data', { children: validChildren })
  } else {
    emit('update-data', { children: [] })
  }
  emit('complete')
}

defineExpose({
  requestNext,
  canProceed,
})

watch(
  children,
  () => {
    emit('update-data', { children: children.value })
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.step-body {
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.children-choice {
  display: flex;
  flex-direction: column;
  gap: v.$space-xl;
}

.children-choice__option--with-body {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
}

.children-choice__body {
  padding-left: calc(v.$space-sm + 1.25rem);
}


.children-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
}

.children-list :deep(.profile-card) {
  padding-left: 0;
}
</style>
