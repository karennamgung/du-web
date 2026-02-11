<template>
  <div class="onboarding-step">
    <h1 class="step-title">약관에 동의해주세요</h1>
    <p class="step-description">서비스 이용을 위해 약관에 동의가 필요합니다.</p>

    <div class="terms-container">
      <label class="terms-checkbox">
        <input
          v-model="allAgreed"
          type="checkbox"
          @change="handleAllAgreed"
        />
        <span>전체 동의</span>
      </label>

      <div class="terms-list">
        <label class="terms-checkbox">
          <input
            v-model="termsAgreed"
            type="checkbox"
            required
          />
          <span>[필수] 서비스 이용약관 동의</span>
          <button type="button" class="link" @click="showTermsDetail('service')">보기</button>
        </label>

        <label class="terms-checkbox">
          <input
            v-model="privacyAgreed"
            type="checkbox"
            required
          />
          <span>[필수] 개인정보 처리방침 동의</span>
          <button type="button" class="link" @click="showTermsDetail('privacy')">보기</button>
        </label>
      </div>
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

interface Props {
  onboardingData: {
    termsAgreed: boolean
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update-data': [data: { termsAgreed: boolean }]
  next: []
}>()

const termsAgreed = ref(props.onboardingData.termsAgreed)
const privacyAgreed = ref(false)

const allAgreed = computed({
  get: () => termsAgreed.value && privacyAgreed.value,
  set: (value) => {
    termsAgreed.value = value
    privacyAgreed.value = value
  },
})

const canProceed = computed(() => termsAgreed.value && privacyAgreed.value)

watch([termsAgreed, privacyAgreed], () => {
  emit('update-data', { termsAgreed: termsAgreed.value && privacyAgreed.value })
})

function handleAllAgreed() {
  termsAgreed.value = allAgreed.value
  privacyAgreed.value = allAgreed.value
}

function showTermsDetail(type: 'service' | 'privacy') {
  // TODO: 약관 상세 모달 구현
  alert(`${type === 'service' ? '서비스 이용약관' : '개인정보 처리방침'} 상세 내용`)
}

function handleNext() {
  if (canProceed.value) {
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

.terms-container {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  padding: v.$space-lg;
  background-color: v.$color-bg-dim;
  border-radius: v.$radius-md;
}

.terms-checkbox {
  display: flex;
  align-items: center;
  gap: v.$space-sm;
  cursor: pointer;

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  span {
    flex: 1;
    @include v.text-body;
  }
}

.terms-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  padding-left: v.$space-md;
  border-left: 2px solid v.$color-border-dim;
}
</style>
