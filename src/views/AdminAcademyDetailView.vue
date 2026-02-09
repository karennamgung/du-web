<template>
  <div class="p-2xl text-center">
    <h1>학원 상세</h1>
    <p class="color-dim mt-sm">학원 ID: {{ route.params.id }}</p>
    <nav class="flex items-center justify-center gap-xs mt-md">
      <router-link to="/" class="link color-primary">사용자</router-link>
      <span class="color-dimmer">|</span>
      <router-link to="/admin" class="link color-primary">학원 페이지</router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
