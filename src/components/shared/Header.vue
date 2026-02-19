<template>
  <header
    class="flex items-center justify-between flex-wrap gap-md p-sm px-lg border-b bg-base"
    :class="{ 'header-px-2rem': route.path === '/' || route.path.startsWith('/admin') }"
  >
    <div class="flex items-center gap-lg flex-wrap">
      <div class="flex items-center gap-sm">
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
            <Icon class="icon-xs color-dim" :path="mdiChevronDown" />
          </button>
        </template>

        <!-- 우리 동네 (통합: 내 위치 chip 이름 / 선택 요약) -->
        <template v-if="myNeighborhood.loading">
          <p class="type-size-sm color-dim">가져오는 중…</p>
        </template>
        <template v-else-if="headerLocationSummary">
          <button
            type="button"
            class="name-btn"
            aria-label="동네 찾기"
            @click="myNeighborhood.showLocationSelectModal = true"
          >
            <h4>{{ headerLocationSummary.name }}</h4>
            <p v-if="headerLocationSummary.extra" class="type-weight-semibold type-size-sm color-dimmer">
              {{ headerLocationSummary.extra }}
            </p>
            <Icon class="icon-xs color-dim" :path="mdiChevronDown" />
          </button>
        </template>
        <button
          v-if="!headerLocationSummary"
          type="button"
          class="link"
          @click="myNeighborhood.showLocationSelectModal = true"
        >
          동네 찾기
        </button>
      </div>
    </div>
    <div class="flex items-center gap-md">
      <template v-if="auth.isAuthenticated">
        <div class="header-user-wrap">
          <button
            type="button"
            class="header-avatar-btn"
            aria-label="사용자 메뉴"
            aria-haspopup="true"
            :aria-expanded="showUserMenu"
            @click="showUserMenu = !showUserMenu"
          >
            <Avatar
              :profile-image-url="profile.profile?.profile_image_url"
              :nickname="profile.profile?.nickname ?? ''"
              size="sm"
            />
          </button>
          <HeaderUserDropdown
            :open="showUserMenu"
            :user-type-label="userTypeLabel"
            :nickname="profile.profile?.nickname ?? '—'"
            :show-admin="!isAdminRoute"
            @close="showUserMenu = false"
            @admin="router.push('/admin')"
            @sign-out="auth.signOut()"
          />
        </div>
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
import Icon from '@/components/shared/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { useMyNeighborhoodStore } from '@/stores/myNeighborhood'
import ProfileInfoModal from '@/components/modals/ProfileInfoModal.vue'
import HeaderUserDropdown from '@/components/shared/HeaderUserDropdown.vue'
import Avatar from './Avatar.vue'
import { useProfileStore, getUserTypeLabel } from '@/stores/profile'
import { mdiChevronLeft, mdiChevronDown } from '@mdi/js'

const emit = defineEmits<{ 'open-login': [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const myNeighborhood = useMyNeighborhoodStore()
const profile = useProfileStore()
const showProfileModal = ref(false)
const showUserMenu = ref(false)

const isAdminRoute = computed(() => /^\/admin/.test(route.path))

const userTypeLabel = computed(() => getUserTypeLabel(profile.profile?.user_type))

const addrKey = (a: { sido: string; gugun: string; dong?: string }) =>
  `${a.sido}|${a.gugun}|${a.dong ?? ''}`

/** 헤더에 표시할 동네 요약 (이름 + optional "(+ N)" 은 <p>로 표시) */
const headerLocationSummary = computed(() => {
  const list = myNeighborhood.selectedAddresses
  const my = myNeighborhood.myLocationAddress
  const others = my ? list.filter((a) => addrKey(a) !== addrKey(my)) : list

  if (my) {
    const name = my.dong ?? my.gugun
    if (others.length === 0) return { name, extra: null }
    return { name, extra: `+${others.length}` }
  }
  if (list.length === 0) return null
  const first = list[0]
  const firstName = first.dong ?? first.gugun
  if (list.length === 1) return { name: firstName, extra: null }
  return { name: firstName, extra: `+${list.length - 1}` }
})

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
/* 지도 페이지(/)일 때 태블릿·데스크톱에서 헤더 좌우 2rem */
.header-px-2rem {
  @media (min-width: 768px) {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.name-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

/* 사용자 아바타 + 드롭다운 */
.header-user-wrap {
  position: relative;
}

.header-avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}
</style>
