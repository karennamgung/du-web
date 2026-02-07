<template>
  <small 
    class="tag" 
    :class="[
      size === 'small' ? 'tag-small' : '',
      type === 'subject' ? 'tag-primary' : 'tag-secondary'
    ]"
  >
    {{ label }}
  </small>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  type: 'subject' | 'age'
  size?: 'base' | 'small'
}>()
</script>
