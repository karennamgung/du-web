<template>
  <button
    type="button"
    class="tab"
    :class="{
      'tab-active': active,
      'tab-with-image': image,
    }"
    @click="$emit('click')"
  >
    <div v-if="image || $slots.media" class="tab-media">
      <img
        v-if="image"
        :src="image"
        :alt="label"
        class="tab-image"
      />
      <slot v-else name="media" />
    </div>
    <span class="type-size-xs type-weight-semibold">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 탭에 표시할 텍스트 */
    label: string
    /** 탭에 표시할 이미지 URL (선택) */
    image?: string | null
    /** 선택/활성 상태 */
    active?: boolean
  }>(),
  { active: false }
)

defineEmits<{
  click: []
}>()
</script>

<style lang="scss" scoped>
.tab {
  flex-shrink: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: v.$space-xs;
  min-width: 4.5rem;
  padding: 0 v.$space-md;
  color: v.$color-text-dimmer;
  cursor: pointer;
  transition: color v.$transition-fast;

  &.tab-active {
    color: v.$color-text-base;
  }

  .tab-media {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
    transform: scale(0.8);
    opacity: 0.5;
    transition: transform v.$transition-fast, opacity v.$transition-fast;
  }

  @media (hover: hover) {
    &:hover .tab-media {
      opacity: 1;
    }
  }

  &.tab-active .tab-media {
    transform: scale(1);
    opacity: 1;
  }

  .tab-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

}
</style>
