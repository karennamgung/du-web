<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <header class="modal-header">
            <h2>아이 정보</h2>
            <button type="button" class="btn btn-ghost btn-icon btn-rounded" aria-label="닫기" @click="close">
              <Icon :path="mdiClose" />
            </button>
          </header>
          <div class="modal-body">
            <div v-if="child" class="child-info">
              <div class="info-item">
                <label>이름</label>
                <p>{{ child.name }}</p>
              </div>
              <div class="info-item">
                <label>출생년도</label>
                <p>{{ child.birth_year }}년 (만 {{ currentAge }}세)</p>
              </div>
              <div v-if="child.education_institution" class="info-item">
                <label>재원중인 교육기관</label>
                <p>{{ child.education_institution }}</p>
              </div>
              <div v-if="child.gender" class="info-item">
                <label>성별</label>
                <p>{{ child.gender === 'male' ? '남자' : '여자' }}</p>
              </div>
            </div>
            <div v-else class="no-child">
              <p>등록된 아이 정보가 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import { mdiClose } from '@mdi/js'
import type { Child } from '@/stores/profile'

interface Props {
  modelValue: boolean
  child: Child | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const currentAge = computed(() => {
  if (!props.child) return 0
  const currentYear = new Date().getFullYear()
  return currentYear - props.child.birth_year
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: v.$space-lg;
}

.modal-content {
  background-color: v.$color-bg-base;
  border-radius: v.$radius-lg;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: v.$shadow-lg;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v.$space-lg;
  border-bottom: 1px solid v.$color-border-dim;

  h2 {
    @include v.text-heading-md;
    margin: 0;
  }
}

.modal-body {
  padding: v.$space-lg;
}

.child-info {
  display: flex;
  flex-direction: column;
  gap: v.$space-lg;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;

  label {
    @include v.text-caption;
    color: v.$color-text-dim;
    font-weight: v.$font-weight-semibold;
  }

  p {
    @include v.text-body;
    margin: 0;
  }
}

.no-child {
  text-align: center;
  padding: v.$space-xl;

  p {
    @include v.text-body;
    color: v.$color-text-dim;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity v.$transition-base;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform v.$transition-base;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
