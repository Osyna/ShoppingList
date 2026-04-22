import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AuthUser } from '../types'
import { authRepo } from '../data/repositories'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(authRepo.currentUser())

  const unsubscribeAuth = authRepo.onChange(() => {
    user.value = authRepo.currentUser()
  })

  const isAuthenticated = computed(() => !!user.value && authRepo.isValid())

  function login(email: string, password: string) {
    return authRepo.login(email, password)
  }

  function signup(email: string, password: string, name: string) {
    return authRepo.signup(email, password, name)
  }

  function logout() {
    authRepo.logout()
  }

  function dispose() {
    unsubscribeAuth()
  }

  return { user, isAuthenticated, login, signup, logout, dispose }
})
