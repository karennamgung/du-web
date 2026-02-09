<template>
  <div class="p-2xl text-center">
    <h1>학원 페이지</h1>
    <p class="color-dim mt-sm">학원 페이지 placeholder</p>
    <nav class="flex items-center justify-center gap-xs mt-md">
      <router-link to="/" class="link color-primary">사용자</router-link>
      <span class="color-dimmer">|</span>
      <router-link to="/admin" class="link color-primary">학원 페이지</router-link>
    </nav>
    <ul class="list-none mt-lg p-0">
      <li v-for="id in [1, 2, 3]" :key="id" class="mt-sm">
        <router-link :to="`/admin/academies/${id}`" class="link color-primary">학원 {{ id }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
</script>
