<template>
  <small 
    class="tag" 
    :class="[
      size === 'small' ? 'tag-small' : '',
      (type ?? 'subject') === 'subject' ? 'tag-primary' : 'tag-secondary'
    ]"
  >
    {{ label }}
  </small>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    type?: 'subject' | 'age'
    size?: 'base' | 'small'
  }>(),
  { type: 'subject' }
)
</script>
