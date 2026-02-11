<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="close"
      >
        <div
          class="modal-content"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
          <header class="modal-header">
            <h2>{{ title }}</h2>
            <button
              type="button"
              class="btn btn-icon-only btn-rounded"
              aria-label="닫기"
              @click="close"
            >
              <Icon :path="mdiClose" />
            </button>
          </header>
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="showFooter" class="modal-footer">
            <button
              type="button"
              class="btn btn-outline"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Icon from '@/components/shared/Icon.vue'
import { mdiClose } from '@mdi/js'

interface Props {
  modelValue: boolean
  title: string
  showFooter?: boolean
  confirmText?: string
  cancelText?: string
}

const props = withDefaults(defineProps<Props>(), {
  showFooter: false,
  confirmText: '확인',
  cancelText: '취소',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
  cancel: []
}>()

function close() {
  emit('update:modelValue', false)
}

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  close()
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

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
}

.modal-content {
  display: flex;
  flex-direction: column;
  background-color: v.$color-bg-base;
  border-radius: v.$radius-lg;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: v.$shadow-lg;
  transition: transform v.$transition-base;

  @media (max-width: 768px) {
    max-height: 85vh;
    border-radius: v.$radius-lg v.$radius-lg 0 0;
    max-width: none;
  }
}

.modal-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: v.$space-lg v.$space-lg v.$space-sm v.$space-lg;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: v.$space-sm v.$space-lg v.$space-lg v.$space-lg;
}

.modal-footer {
  flex-shrink: 0;
  display: flex;
  gap: v.$space-sm;
  justify-content: flex-end;
  padding: v.$space-lg;
  border-top: 1px solid v.$color-border-dim;
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

@media (max-width: 768px) {
  .modal-enter-from .modal-content,
  .modal-leave-to .modal-content {
    transform: translateY(100%);
  }

  .modal-enter-to .modal-content,
  .modal-leave-from .modal-content {
    transform: translateY(0);
  }
}
</style>
