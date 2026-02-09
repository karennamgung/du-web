<template>
  <header
    class="flex items-center justify-between flex-wrap gap-md p-md px-lg border-b bg-base"
    :class="{ 'header-px-2rem': route.path === '/' || route.path.startsWith('/admin') }"
  >
    <div class="flex items-center gap-lg flex-wrap">
      <div class="flex items-center gap-xs">
        <button
        v-if="route.path !== '/' && !route.path.startsWith('/admin')"
        type="button"
        class="btn btn-icon-only btn-rounded mr-sm"
        aria-label="뒤로가기"
        @click="goBack"
      >
        <Icon :path="mdiChevronLeft" />
      </button>

        <!-- 학부모 또는 학생인 경우 이름 표시 -->
        <template v-if="profile.profile && (profile.profile.user_type === 'parent' || profile.profile.user_type === 'student')">
          <button
            type="button"
            class="name-btn"
            @click="showProfileModal = true"
          >
            <h4>{{ profile.displayName }}</h4>
          </button>
        </template>

        <!-- 우리 동네 표시 -->
        <template v-if="myNeighborhood.loading">
          <p class="type-size-sm color-dim">가져오는 중…</p>
        </template>
        <template v-else-if="myNeighborhood.name">
          <h4>{{ myNeighborhood.name }}</h4>
          <button
            type="button"
            class="btn btn-ghost btn-small btn-icon btn-rounded"
            aria-label="동네 해제"
            @click="myNeighborhood.clear()"
          >
            <Icon class="icon-2xs color-dim" :path="mdiClose" />
          </button>
        </template>
        <button
          v-else
          type="button"
          class="btn btn-outline"
          @click="handleLocationClick"
        >
          위치 찾기
        </button>
      </div>
    </div>
    <div class="flex items-center gap-md">
      <button v-if="!isAdminRoute" type="button" class="btn btn-icon-only" @click="router.push('/admin')">학원관리자</button>
      <template v-if="auth.isAuthenticated">
        <button type="button" class="btn btn-outline" @click="auth.signOut()">로그아웃</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn-primary" @click="emit('open-login')">로그인</button>
      </template>
    </div>
  </header>

  <ProfileInfoModal v-model="showProfileModal" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import { useProfileStore } from '@/stores/profile'
import ProfileInfoModal from '@/components/ProfileInfoModal.vue'
import { mdiClose, mdiChevronLeft } from '@mdi/js'

const emit = defineEmits<{ 'open-login': [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const profile = useProfileStore()
const showProfileModal = ref(false)

const isAdminRoute = computed(() => /^\/admin/.test(route.path))

function goBack() {
  router.back()
}

async function handleLocationClick() {
  myNeighborhood.requestShowMyLocation = true
  await myNeighborhood.fetchFromLocation()
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

/* 지도 페이지(/)일 때 태블릿·데스크톱에서 헤더 좌우 2rem */
.header-px-2rem {
  @media (min-width: 768px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.name-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;

  h4 {
    margin: 0;
    color: v.$color-primary;
    transition: color v.$transition-fast;

    &:hover {
      color: v.$color-primary-strong;
      text-decoration: underline;
    }
  }
}
</style>
