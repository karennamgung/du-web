<template>
  <Teleport to="body">
    <Transition name="dropdown">
      <div
        v-if="open"
        class="header-user-dropdown-overlay"
        aria-hidden="true"
        @click="$emit('close')"
      />
    </Transition>
  </Teleport>
  <Transition name="dropdown">
    <div v-if="open" class="header-user-dropdown-panel" role="menu" @click.stop>
      <div class="header-user-dropdown-info">
        <p class="header-user-dropdown-type">{{ userTypeLabel }}</p>
        <p class="header-user-dropdown-nickname">{{ nickname }}</p>
      </div>
      <div class="header-user-dropdown-actions">
        <button
          v-if="showAdmin"
          type="button"
          class="header-user-dropdown-action"
          role="menuitem"
          @click="$emit('admin'); $emit('close')"
        >
          학원관리자
        </button>
        <button
          type="button"
          class="header-user-dropdown-action"
          role="menuitem"
          @click="$emit('signOut'); $emit('close')"
        >
          로그아웃
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  open: boolean
  userTypeLabel: string
  nickname: string
  showAdmin: boolean
}>()

defineEmits<{
  close: []
  admin: []
  signOut: []
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.header-user-dropdown-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.header-user-dropdown-panel {
  position: absolute;
  right: 0;
  top: calc(100% + v.$space-xs);
  z-index: 1000;
  min-width: 12rem;
  padding: v.$space-md;
  background: v.$color-bg-base;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  box-shadow: v.$shadow-lg;
}

.header-user-dropdown-info {
  padding-bottom: v.$space-sm;
  border-bottom: 1px solid v.$color-border-dim;
  margin-bottom: v.$space-sm;

  .header-user-dropdown-type {
    margin: 0;
    font-size: 0.75rem;
    color: v.$color-text-dim;
  }

  .header-user-dropdown-nickname {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: v.$color-text-base;
  }
}

.header-user-dropdown-actions {
  display: flex;
  flex-direction: column;
  gap: v.$space-2xs;
}

.header-user-dropdown-action {
  display: block;
  width: 100%;
  padding: v.$space-sm v.$space-md;
  font-size: 0.875rem;
  text-align: left;
  border: none;
  border-radius: v.$radius-sm;
  background: none;
  color: v.$color-text-base;
  cursor: pointer;
  transition: background-color v.$transition-fast;

  &:hover {
    background: v.$color-bg-dimmer;
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity v.$transition-fast, transform v.$transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}

.header-user-dropdown-panel.dropdown-enter-from,
.header-user-dropdown-panel.dropdown-leave-to {
  transform: translateY(-4px);
}
</style>
