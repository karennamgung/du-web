<template>
  <Teleport to="body">
    <Transition :name="isMobile ? 'sheet' : 'modal'">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click.self="close"
      >
        <div
          class="modal-content sheet-panel modal-panel"
          role="dialog"
          aria-modal="true"
          :style="isMobile && modalDragOffset > 0 ? { transform: `translateY(${modalDragOffset}px)` } : {}"
          @click.stop
        >
            <ModalHeader
              :title="title"
              :is-mobile="isMobile"
              :is-bottom-sheet-maximized="!isMobile"
              :show-close-button="true"
              @close="close"
              @drag-start="onHeaderDragStart"
              @drag-move="onHeaderDragMove"
              @drag-end="onHeaderDragEnd"
            />
          <div class="modal-body">
            <slot />
          </div>
          <footer v-if="showFooter" class="modal-footer">
            <slot name="footer" :close="close" :confirm="handleConfirm" :cancel="handleCancel">
              <button
                type="button"
                class="btn btn-outline min-w-6"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                type="button"
                class="btn btn-primary flex-1"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import ModalHeader from '@/components/shared/ModalHeader.vue'

const isMobile = ref(false)
const modalDragOffset = ref(0)
let dragStartY = 0
let isDraggingModal = false

function updateIsMobile() {
  isMobile.value = window.innerWidth < 768
}

function getClientY(e: MouseEvent | TouchEvent): number {
  return 'touches' in e ? e.touches[0].clientY : e.clientY
}

function onHeaderDragStart(e: MouseEvent | TouchEvent) {
  if (!isMobile.value) return
  isDraggingModal = true
  dragStartY = getClientY(e)
  modalDragOffset.value = 0
  window.addEventListener('touchmove', onHeaderDragMove, { passive: false })
  window.addEventListener('touchend', onHeaderDragEnd)
  window.addEventListener('mousemove', onHeaderDragMove)
  window.addEventListener('mouseup', onHeaderDragEnd)
}

function onHeaderDragMove(e: MouseEvent | TouchEvent) {
  if (!isDraggingModal || !isMobile.value) return
  const clientY = 'touches' in e ? (e as TouchEvent).touches[0]?.clientY : (e as MouseEvent).clientY
  if (clientY == null) return
  const deltaY = clientY - dragStartY
  if (deltaY > 0) modalDragOffset.value = deltaY
  if ('touches' in e) e.preventDefault()
}

const TRANSITION_MS = 300

function onHeaderDragEnd() {
  if (!isDraggingModal) return
  isDraggingModal = false
  window.removeEventListener('touchmove', onHeaderDragMove)
  window.removeEventListener('touchend', onHeaderDragEnd)
  window.removeEventListener('mousemove', onHeaderDragMove)
  window.removeEventListener('mouseup', onHeaderDragEnd)
  const threshold = Math.min(120, window.innerHeight * 0.2)
  if (modalDragOffset.value >= threshold) {
    modalDragOffset.value = window.innerHeight
    setTimeout(() => close(), TRANSITION_MS)
  } else {
    modalDragOffset.value = 0
  }
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile)
  if (isDraggingModal) {
    window.removeEventListener('touchmove', onHeaderDragMove)
    window.removeEventListener('touchend', onHeaderDragEnd)
    window.removeEventListener('mousemove', onHeaderDragMove)
    window.removeEventListener('mouseup', onHeaderDragEnd)
  }
})

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

watch(
  () => props.modelValue,
  (open) => {
    if (open) modalDragOffset.value = 0
  }
)

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
  padding: v.$space-lg;

  @media (max-width: 768px) {
    max-height: 85vh;
    border-radius: v.$radius-lg v.$radius-lg 0 0;
    padding: 0 v.$space-lg v.$space-lg v.$space-lg;
    max-width: none;
  }
}

.modal-small-header-wrap {
  flex-shrink: 0;
}

.modal-small-header-wrap :deep(.modal-header-content) {
  padding: 0;
}

.modal-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.modal-footer {
  flex-shrink: 0;
  display: flex;
  gap: v.$space-sm;
  justify-content: flex-end;
  padding-top: v.$space-lg;
}
</style>
