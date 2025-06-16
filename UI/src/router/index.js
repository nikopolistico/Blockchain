import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/user/HomeViews.vue'
import TanodLogin from '@/views/barangay/Tanod/TanodLogin.vue'
import TanodInterface from '@/views/barangay/Tanod/TanodInterface.vue'
import BarangayView from '@/views/barangay/BarangayView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/barangay',
    name: 'barangay',
    component: BarangayView,
  },
  {
    path: '/tanodlogin',
    name: 'tanodlogin',
    component: TanodLogin,
  },
  {
    path: '/tanodinterface',
    name: 'tanodinterface',
    component: TanodInterface,
    beforeEnter: (to, from, next) => {
      if (to.query.user) {
        next() // Allow navigation if 'user' is present in the query
      } else {
        next('/tanodlogin') // Redirect to login if not logged in
      }
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
