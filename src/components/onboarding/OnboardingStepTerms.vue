<template>
  <div class="terms-container">
      <label class="input-checkbox-label">
        <input
          v-model="allAgreed"
          type="checkbox"
          @change="handleAllAgreed"
        />
        <span>전체 동의</span>
      </label>

      <div class="terms-list">
        <label class="input-checkbox-label">
          <input
            v-model="termsAgreed"
            type="checkbox"
            required
          />
          <span class="flex-1">[필수] 서비스 이용약관 동의</span>
          <button type="button" class="link" @click="showTermsDetail('service')">보기</button>
        </label>

        <label class="input-checkbox-label">
          <input
            v-model="privacyAgreed"
            type="checkbox"
            required
          />
          <span class="flex-1">[필수] 개인정보 처리방침 동의</span>
          <button type="button" class="link" @click="showTermsDetail('privacy')">보기</button>
        </label>
      </div>
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

function requestNext() {
  if (canProceed.value) {
    emit('next')
  }
}

defineExpose({
  requestNext,
  canProceed,
})
</script>

<style lang="scss" scoped>
.terms-container {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  padding: v.$space-lg;
  background-color: v.$color-bg-dimmer;
  border-radius: v.$radius-md;
}

.terms-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  padding-left: v.$space-lg;
}
</style>
