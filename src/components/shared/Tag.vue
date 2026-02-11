<template>
  <p
    class="tag"
    :class="[
      size === 'small' ? 'tag-small' : '',
      `tag-${variant}`
    ]"
  >
  {{ label }}
</p>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    variant?: 'primary' | 'secondary' | 'gray'
    size?: 'base' | 'small'
  }>(),
  { variant: 'primary', size: 'base' }
)
</script>

<style scoped>
</style>
