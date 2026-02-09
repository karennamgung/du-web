<template>
  <div class="onboarding-step">
    <h1 class="step-title">거주지를 알려주세요</h1>
    <p class="step-description">맞춤형 교육 정보를 제공하기 위해 거주 지역이 필요해요.</p>

    <div class="residence-form">
      <div class="input-group">
        <label for="residence">거주지</label>
        <input
          id="residence"
          v-model="residence"
          type="text"
          placeholder="예: 서울시 강남구"
          class="input"
          @input="handleInput"
        />
        <p class="input-hint">시/도, 시/군/구 단위로 입력해주세요.</p>
      </div>

      <button
        type="button"
        class="btn btn-outline w-full"
        @click="handleLocationClick"
      >
        현재 위치로 설정
      </button>
    </div>

    <button
      type="button"
      class="btn btn-primary w-full mt-xl"
      :disabled="!canProceed"
      @click="handleNext"
    >
      다음
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'

interface Props {
  onboardingData: {
    residence: string | null
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { residence: string | null }]
  next: []
}>()

const myNeighborhood = useMyNeighborhoodStore()
const residence = ref(props.onboardingData.residence || '')

const canProceed = computed(() => residence.value.trim().length > 0)

watch(residence, () => {
  emit('update-data', { residence: residence.value.trim() || null })
})

function handleInput() {
  emit('update-data', { residence: residence.value.trim() || null })
}

async function handleLocationClick() {
  myNeighborhood.requestShowMyLocation = true
  await myNeighborhood.fetchFromLocation()
  if (myNeighborhood.name) {
    residence.value = myNeighborhood.name
    emit('update-data', { residence: residence.value })
  }
}

function handleNext() {
  console.log('[OnboardingStepResidence] 다음 버튼 클릭:', {
    residence: residence.value,
    canProceed: canProceed.value,
  })
  
  if (canProceed.value) {
    // 최종 데이터 업데이트
    emit('update-data', { residence: residence.value.trim() || null })
    // 다음 단계로 이동
    emit('next')
  } else {
    console.warn('[OnboardingStepResidence] 다음 단계로 진행할 수 없음: 거주지가 입력되지 않음')
  }
}
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

.residence-form {
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

  .input-hint {
    @include v.text-caption;
    margin: 0;
  }
}
</style>
