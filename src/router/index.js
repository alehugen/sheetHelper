import { createRouter, createWebHistory } from 'vue-router'

import { i18n } from '@/i18n'
import { useReceiptsStore } from '@/presentation/stores/receipts'

const routes = [
  {
    path: '/',
    name: 'upload',
    component: () => import('@/presentation/views/UploadView.vue'),
    meta: { titleKey: 'nav.upload' },
  },
  {
    path: '/revisao',
    name: 'review',
    component: () => import('@/presentation/views/ReviewView.vue'),
    meta: { titleKey: 'nav.review', requiresReceipts: true },
  },
  {
    path: '/preencher',
    name: 'fill',
    component: () => import('@/presentation/views/FillView.vue'),
    meta: { titleKey: 'fill.goToFill', requiresReceipts: true },
  },
  {
    path: '/historico',
    name: 'history',
    component: () => import('@/presentation/views/HistoryView.vue'),
    meta: { titleKey: 'nav.history' },
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'upload' } },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (!to.meta.requiresReceipts) return true
  return useReceiptsStore().hasReceipts ? true : { name: 'upload' }
})

router.afterEach((to) => {
  document.title = to.meta.titleKey
    ? `${i18n.global.t(to.meta.titleKey)} · sheetHelper`
    : 'sheetHelper'
})

export default router
