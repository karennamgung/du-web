<template>
  <div v-if="suggestions.length" class="search-dropdown-list">
    <button
      v-for="item in suggestions"
      :key="item.id"
      type="button"
      class="search-dropdown-item"
      role="option"
      @mousedown.prevent="emit('select', item.id)"
    >
      <p class="type-weight-semibold">{{ item.primaryText }}</p>
      <p v-if="item.secondaryText" class="type-size-xs color-dim">
        {{ item.secondaryText }}
      </p>
    </button>
  </div>
  <p v-else class="p-md color-dim">결과가 없습니다.</p>
</template>

<script setup lang="ts">
export interface AcademyListModalBodyItem {
  id: string;
  primaryText: string;
  secondaryText?: string;
}

defineProps<{
  suggestions: AcademyListModalBodyItem[];
}>();

const emit = defineEmits<{
  select: [id: string];
}>();
</script>
