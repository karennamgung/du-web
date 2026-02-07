<template>
  <div id="app">
    <Header @open-login="showLoginModal = true" />
    <main>
      <router-view />
    </main>
    <LoginModal v-model="showLoginModal" :academy-id="null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginModal from '@/components/LoginModal.vue'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'

const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const showLoginModal = ref(false)

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
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
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
</style>
