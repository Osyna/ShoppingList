import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'

const LoginView = () => import('./views/LoginView.vue')
const SignupView = () => import('./views/SignupView.vue')
const ListsView = () => import('./views/ListsView.vue')
const ListDetailView = () => import('./views/ListDetailView.vue')
const ListRulesView = () => import('./views/ListRulesView.vue')
const CategoriesView = () => import('./views/CategoriesView.vue')

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/signup', name: 'signup', component: SignupView, meta: { public: true } },
    { path: '/', name: 'lists', component: ListsView },
    { path: '/lists/:id', name: 'list-detail', component: ListDetailView, props: true },
    { path: '/lists/:id/rules', name: 'list-rules', component: ListRulesView, props: true },
    { path: '/categories', name: 'categories', component: CategoriesView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const authed = auth.isAuthenticated
  if (!to.meta.public && !authed) return { name: 'login' }
  if (to.meta.public && authed) return { name: 'lists' }
})
