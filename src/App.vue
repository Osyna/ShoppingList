<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useListsStore } from './stores/lists'
import { useCategoriesStore } from './stores/categories'
import { useToast } from './composables/useToast'
import { usePwa } from './composables/usePwa'
import { useI18n } from './i18n'
import AppLayout from './layouts/AppLayout.vue'
import ToastStack from './components/common/ToastStack.vue'

const auth = useAuthStore()
const lists = useListsStore()
const categories = useCategoriesStore()
const route = useRoute()
const { toasts, error, info } = useToast()
const t = useI18n()

const { needRefresh, offlineReady, update } = usePwa()
watch(offlineReady, (v) => v && info(t.pwa.offlineReady))
watch(needRefresh, (v) => {
  if (!v) return
  info(t.pwa.updateAvailable)
  // registerType: 'autoUpdate' means the new SW is already installed —
  // activate it on the next tick so the next navigation picks it up.
  setTimeout(update, 50)
})

const isPublic = computed(() => route.meta.public === true)
const showShell = computed(() => !isPublic.value && auth.isAuthenticated)

watch(
  () => auth.isAuthenticated,
  async (authed) => {
    if (authed) {
      try {
        await Promise.all([
          lists.fetchAll(),
          categories.fetchAll(),
          lists.subscribe(),
          categories.subscribe(),
        ])
      } catch {
        error(t.common.networkError)
      }
    } else {
      await lists.unsubscribe()
      await categories.unsubscribe()
    }
  },
  { immediate: true }
)
</script>

<template>
  <AppLayout v-if="showShell">
    <RouterView />
  </AppLayout>
  <RouterView v-else />
  <ToastStack :toasts="toasts" />
</template>
