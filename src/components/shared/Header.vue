<template>
  <header
    class="header-root border-b bg-base"
    :class="{
      'page-padding': route.path === '/' || route.path.startsWith('/admin'),
      'has-sub': !!subHeaderStore.entry,
    }"
  >
    <div class="header-inner flex items-center justify-between gap-md pt-sm px-lg">
      <div class="header-left flex-shrink-0">
        <router-link
          v-if="subHeaderStore.entry"
          to="/"
          class="header-logo"
          aria-label="홈"
        >
          <img src="/logo-du.png" alt="DU" class="header-logo-img" />
        </router-link>
        <button
          v-else-if="route.path !== '/' && !route.path.startsWith('/admin')"
          type="button"
          class="btn btn-icon-only btn-rounded"
          aria-label="뒤로가기"
          @click="goBack"
        >
          <Icon :path="mdiChevronLeft" />
        </button>
      </div>

      <div
        v-if="subHeaderStore.entry"
        :ref="(el) => subHeaderStore.setWrapperRef(el as HTMLElement | null)"
        class="header-sub flex-shrink-0 bg-base w-full min-w-0"
      >
        <component
          :is="subHeaderStore.entry.component"
          v-bind="subHeaderStore.entry.props"
          v-on="subHeaderStore.entry.listeners"
        />
      </div>

      <div class="header-right flex-shrink-0">
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
    </div>
  </header>

  <ProfileInfoModal
    :model-value="profile.showProfileModal"
    @update:model-value="profile.showProfileModal = $event"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Icon from '@/components/shared/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import ProfileInfoModal from '@/components/modals/ProfileInfoModal.vue'
import HeaderUserDropdown from '@/components/shared/HeaderUserDropdown.vue'
import Avatar from './Avatar.vue'
import { useProfileStore, getUserTypeLabel } from '@/stores/profile'
import { useSubHeaderStore } from '@/stores/subHeader'
import { mdiChevronLeft } from '@mdi/js'

const emit = defineEmits<{ 'open-login': [] }>()
const subHeaderStore = useSubHeaderStore()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const profile = useProfileStore()
const showUserMenu = ref(false)

const isAdminRoute = computed(() => /^\/admin/.test(route.path))

const userTypeLabel = computed(() => getUserTypeLabel(profile.profile?.user_type))

function goBack() {
  router.back()
}
</script>

<style lang="scss" scoped>
.header-root {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.header-inner {
  min-height: 3.25rem;
}

/* 모바일: 좌우 한 줄 + 서브헤더는 아래 전체 너비 */
.header-root:not(.has-sub) .header-inner {
  flex-wrap: nowrap;
}

/* 모바일 + 서브헤더: 1행 로고|아바타, 2행 서브헤더 전체 */
.header-root.has-sub .header-inner {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 0 v.$space-md;
}

.header-root.has-sub .header-left {
  grid-column: 1;
  grid-row: 1;
}

.header-root.has-sub .header-right {
  grid-column: 2;
  grid-row: 1;
}

.header-root.has-sub .header-sub {
  grid-column: 1 / -1;
  grid-row: 2;
  width: 100%;
  min-width: 0;
  background: v.$color-bg-base;

  @media (max-width: 768px) {
    margin-top: v.$space-md;
  }
}

/* 태블릿·데스크톱: 로고 | 서브헤더(max-width) | 아바타 한 줄 */
@media (min-width: 768px) {
  .header-root.has-sub .header-inner {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: flex-start;
    justify-content: space-between;
  }

  .header-root.has-sub .header-left {
    grid-column: auto;
    grid-row: auto;
  }

  .header-root.has-sub .header-sub {
    grid-column: auto;
    grid-row: auto;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 36rem; /* 576px — 에어비앤비 검색바 스타일 */
    margin: 0 v.$space-lg;
    border-top: none;
  }

  .header-root.has-sub .header-right {
    grid-column: auto;
    grid-row: auto;
  }
}

.header-logo {
  display: flex;
  align-items: center;
  text-decoration: none;

  &:hover .header-logo-img {
    opacity: 0.85;
  }
}

.header-logo-img {
  display: block;
  height: 1.75rem;
  width: auto;
  object-fit: contain;
  transition: opacity 0.15s ease;
}

/* 지도 페이지 등에서 사용하는 서브 헤더(필터/검색 바) */
.header-sub {
  :deep(.map-category-bar) {
    padding: 0;
    width: 100%;
    min-width: 0;
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
