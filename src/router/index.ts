import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Map',
    component: () => import('@/views/MapPageView.vue'),
    meta: { title: '지도' },
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
    meta: { title: '관리자' },
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

export default router
