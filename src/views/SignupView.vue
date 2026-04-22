<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useListsStore } from '../stores/lists'
import { useCategoriesStore } from '../stores/categories'
import { useToast } from '../composables/useToast'
import { useAuthErrorMessage } from '../composables/useAuthErrorMessage'
import { useI18n } from '../i18n'
import AuthLayout from '../layouts/AuthLayout.vue'
import AuthForm, { type AuthFormField, type AuthFormPayload } from '../components/auth/AuthForm.vue'

const auth = useAuthStore()
const lists = useListsStore()
const categories = useCategoriesStore()
const router = useRouter()
const { error } = useToast()
const t = useI18n()
const authMessage = useAuthErrorMessage()

const loading = ref(false)

const fields: AuthFormField[] = [
  { key: 'name', label: t.auth.name, type: 'text', autocomplete: 'name', required: true },
  { key: 'email', label: t.auth.email, type: 'email', autocomplete: 'email', required: true },
  {
    key: 'password',
    label: t.auth.password,
    type: 'password',
    autocomplete: 'new-password',
    required: true,
    minlength: 8,
  },
  {
    key: 'passwordConfirm',
    label: t.auth.passwordConfirm,
    type: 'password',
    autocomplete: 'new-password',
    required: true,
    minlength: 8,
  },
]

async function submit(payload: AuthFormPayload) {
  if (payload.password !== payload.passwordConfirm) {
    error(t.auth.passwordsMismatch)
    return
  }
  loading.value = true
  try {
    await auth.signup(payload.email, payload.password, payload.name)
    await categories.seedDefaults({ defaults: t.categories.defaults })
    await Promise.all([
      lists.fetchAll(),
      categories.fetchAll(),
      lists.subscribe(),
      categories.subscribe(),
    ])
    router.push({ name: 'lists' })
  } catch (e) {
    error(authMessage(e, t.auth.signupFailed))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t.appName" :tagline="t.auth.signup + ' — ' + 'créez votre premier panier.'">
    <AuthForm
      :fields="fields"
      :submit-label="t.auth.signupCta"
      :loading="loading"
      @submit="submit"
    />
    <p style="text-align: center; font-size: 14px; color: var(--ink-3); margin: 22px 0 0">
      {{ t.auth.hasAccount }}
      <router-link
        :to="{ name: 'login' }"
        style="color: var(--accent-ink); text-decoration: underline; text-underline-offset: 3px; font-weight: 600"
      >
        {{ t.auth.loginCta }}
      </router-link>
    </p>
  </AuthLayout>
</template>
