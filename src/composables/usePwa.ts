import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'

/**
 * PWA lifecycle — exposes `needRefresh` (a new service worker waits) and
 * `offlineReady` (first precache complete, app works without network now).
 * Caller shows a toast and optionally calls `update()` to activate the SW.
 */
export function usePwa() {
  const needRefresh = ref(false)
  const offlineReady = ref(false)

  const updateSW = registerSW({
    onNeedRefresh() {
      needRefresh.value = true
    },
    onOfflineReady() {
      offlineReady.value = true
    },
  })

  function update() {
    needRefresh.value = false
    updateSW(true)
  }

  return { needRefresh, offlineReady, update }
}
