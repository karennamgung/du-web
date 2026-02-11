import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { title: '온보딩', requiresAuth: true },
  },
  {
    path: '/',
    name: 'Map',
    component: () => import('@/views/MapPageView.vue'),
    meta: { title: '지도', requiresAuth: false },
  },
  {
    path: '/academies/:id',
    name: 'AcademyDetail',
    component: () => import('@/views/AcademyDetailView.vue'),
    meta: { title: '학원 상세' },
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: '학원 페이지', requiresAuth: true },
  },
  {
    path: '/admin/academies/:id',
    name: 'AdminAcademyDetail',
    component: () => import('@/views/AdminAcademyDetailView.vue'),
    meta: { title: '학원 상세' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 온보딩 체크 가드
router.beforeEach(async (to, _from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const { useProfileStore } = await import('@/stores/profile')
  
  const auth = useAuthStore()
  const profile = useProfileStore()

  // 디버깅 로그
  console.log('[Router Guard]', {
    to: to.path,
    authenticated: auth.isAuthenticated,
    hasProfile: !!profile.profile,
    onboardingCompleted: profile.isOnboardingCompleted,
    loading: profile.loading,
  })

  // 온보딩 페이지는 인증 없이도 접근 가능 (하지만 완료하려면 로그인 필요)
  // 인증되지 않은 사용자도 온보딩 페이지는 볼 수 있도록 허용

  // 인증된 사용자는 온보딩 완료 여부를 체크해야 함
  if (auth.isAuthenticated) {
    try {
      // 프로필이 아직 로드되지 않은 경우 로드 시도
      if (!profile.profile && !profile.loading) {
        console.log('[Router Guard] 프로필 로드 시작')
        await profile.loadProfile()
        console.log('[Router Guard] 프로필 로드 완료', {
          hasProfile: !!profile.profile,
          onboardingCompleted: profile.isOnboardingCompleted,
        })
      }

      // 프로필이 없거나 온보딩이 완료되지 않은 경우
      if (!profile.profile || !profile.isOnboardingCompleted) {
        console.log('[Router Guard] 온보딩 필요:', {
          hasProfile: !!profile.profile,
          onboardingCompleted: profile.isOnboardingCompleted,
          currentPath: to.path,
        })
        // 온보딩 페이지가 아닌 경우에만 리디렉션
        if (to.name !== 'Onboarding') {
          console.log('[Router Guard] 온보딩 페이지로 리디렉션')
          next({ path: '/onboarding', replace: true })
          return
        }
      } else {
        // 온보딩이 완료된 상태에서 온보딩 페이지로 가려고 하면 홈으로 리디렉션
        if (to.name === 'Onboarding') {
          console.log('[Router Guard] 온보딩 완료됨, 홈으로 리디렉션')
          if (profile.profile.user_type === 'academy') {
            next('/admin')
          } else {
            next('/')
          }
          return
        }
      }
    } catch (error) {
      console.error('[Router Guard] 프로필 로드 실패:', error)
      // 프로필 로드 실패 시 (테이블이 없거나 에러 발생)
      // 온보딩 페이지가 아니면 온보딩으로 리디렉션
      if (to.name !== 'Onboarding') {
        console.log('[Router Guard] 에러 발생, 온보딩으로 리디렉션')
        next({ path: '/onboarding', replace: true })
        return
      }
    }
  }

  // 인증이 필요한 라우트 체크 (온보딩과 별개)
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    // 인증이 필요한 페이지지만 인증되지 않은 경우
    // 온보딩 페이지가 아니면 홈으로 리디렉션 (로그인 모달은 Header에서 처리)
    if (to.name !== 'Onboarding') {
      next('/')
      return
    }
  }

  console.log('[Router Guard] 통과:', to.path)
  next()
})

export default router
