<template>
  <div id="app">
    <Header @open-login="showLoginModal = true" />
    <main :class="{ 'main--no-scroll': isMapPage }">
      <router-view :key="route.fullPath" />
    </main>
    <LoginModal v-model="showLoginModal" :academy-id="null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import LoginModal from '@/components/LoginModal.vue'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'

const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const showLoginModal = ref(false)
const route = useRoute()

/** 지도 페이지: main 영역 스크롤 비활성화(모바일에서 바깥 스크롤로 목록 위치 밀림 방지) */
const isMapPage = computed(() => route.name === 'Map')

onMounted(() => {
  auth.init()
  myNeighborhood.restoreFromStorage()
})
</script>

<style lang="scss">
@use '@/assets/styles/index' as v;

html,
body {
  height: 100%;
  margin: 0;
  /* 모바일: 문서 단위 스크롤 방지(지도/화면 밖 스크롤로 학원 목록 위치 밀림 방지) */
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh; /* 모바일 주소창 고려 */
  overflow: hidden;
  font-family: v.$font-family-fallback;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: v.$color-text-base;
}

#app main {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

/* 지도 페이지: main 스크롤 비활성화, 내부(지도·바텀시트)만 스크롤 */
#app main.main--no-scroll {
  overflow: hidden;
}
</style>
