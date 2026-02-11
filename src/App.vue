<template>
  <div id="app">
    <Header v-if="!isOnboardingPage" @open-login="showLoginModal = true" />
    <main :class="{ 'main--no-scroll': isMapPage }">
      <router-view :key="route.fullPath" />
    </main>
    <LoginModal v-model="showLoginModal" :academy-id="null" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoginModal from '@/components/modals/LoginModal.vue'
import Header from '@/components/shared/Header.vue'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import { useProfileStore } from '@/stores/profile'

const router = useRouter()
const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const profile = useProfileStore()
const showLoginModal = ref(false)
const route = useRoute()

/** 지도 페이지: main 영역 스크롤 비활성화(모바일에서 바깥 스크롤로 목록 위치 밀림 방지) */
const isMapPage = computed(() => route.name === 'Map')
const isOnboardingPage = computed(() => route.name === 'Onboarding')

onMounted(async () => {
  await auth.init()
  myNeighborhood.restoreFromStorage()

  // 인증된 사용자: 프로필 로드 후 온보딩 미완료면 무조건 온보딩으로 (가입 후 한 번도 안 한 경우)
  if (auth.isAuthenticated) {
    await profile.loadProfile()
    if (!profile.profile || !profile.isOnboardingCompleted) {
      if (route.name !== 'Onboarding') {
        router.replace('/onboarding')
      }
    }
  }

  // 인증 상태 변경 감지 (OAuth 복귀 등): 프로필 로드 후 온보딩 미완료면 온보딩으로
  auth.$subscribe(() => {
    if (auth.isAuthenticated) {
      profile.loadProfile().then(() => {
        if (!profile.profile || !profile.isOnboardingCompleted) {
          if (route.name !== 'Onboarding') {
            router.replace('/onboarding')
          }
        }
      })
    } else {
      profile.profile = null
      profile.children = []
    }
  })
})
</script>

<style lang="scss">
html,
body {
  height: 100%;
  margin: 0;
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
