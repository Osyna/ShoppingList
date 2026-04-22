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
  { key: 'email', label: t.auth.email, type: 'email', autocomplete: 'email', required: true },
  {
    key: 'password',
    label: t.auth.password,
    type: 'password',
    autocomplete: 'current-password',
    required: true,
  },
]

async function submit(payload: AuthFormPayload) {
  loading.value = true
  try {
    await auth.login(payload.email, payload.password)
    await Promise.all([
      lists.fetchAll(),
      categories.fetchAll(),
      lists.subscribe(),
      categories.subscribe(),
    ])
    router.push({ name: 'lists' })
  } catch (e) {
    error(authMessage(e, t.auth.invalid))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout :title="t.appName" :tagline="t.auth.login + ' — ' + 'retrouvez vos listes.'">
    <AuthForm
      :fields="fields"
      :submit-label="t.auth.loginCta"
      :loading="loading"
      @submit="submit"
    />
    <p style="text-align: center; font-size: 14px; color: var(--ink-3); margin: 22px 0 0">
      {{ t.auth.noAccount }}
      <router-link
        :to="{ name: 'signup' }"
        style="color: var(--accent-ink); text-decoration: underline; text-underline-offset: 3px; font-weight: 600"
      >
        {{ t.auth.signupCta }}
      </router-link>
    </p>
  </AuthLayout>
</template>
