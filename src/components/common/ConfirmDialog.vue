<script setup lang="ts">
import { useI18n } from '../../i18n'
import UiButton from '../../ui/UiButton.vue'
import UiIcon from '../../ui/UiIcon.vue'
import UiModal from '../../ui/UiModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    message: string
    title?: string
    confirmLabel?: string
    cancelLabel?: string
    busy?: boolean
    destructive?: boolean
    mode?: 'modal' | 'fullscreen'
  }>(),
  { destructive: true, mode: 'modal' }
)

defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

const t = useI18n()
</script>

<template>
  <UiModal
    v-if="mode === 'modal'"
    :open="open"
    size="sm"
    :title="title ?? t.common.confirm"
    @close="$emit('cancel')"
  >
    <p style="color: var(--ink-2); font-size: 14.5px; line-height: 1.5; margin: 0">{{ message }}</p>

    <template #footer>
      <UiButton variant="ghost" :disabled="busy" @click="$emit('cancel')">
        {{ cancelLabel ?? t.common.cancel }}
      </UiButton>
      <UiButton
        :variant="destructive ? 'danger' : 'primary'"
        :disabled="busy"
        @click="$emit('confirm')"
      >
        {{ busy ? t.common.loading : confirmLabel ?? t.common.confirm }}
      </UiButton>
    </template>
  </UiModal>

  <Teleport v-else-if="open" to=".phone">
    <div class="fullscreen-overlay" role="dialog" aria-modal="true">
      <div class="topbar compact-top">
        <button class="back-chev" :aria-label="t.common.cancel" @click="$emit('cancel')">
          <UiIcon name="back" :size="18" />
        </button>
        <div class="title-inline">
          <h1>{{ title ?? t.common.confirm }}</h1>
        </div>
        <span style="width: 40px" />
      </div>

      <div class="fullscreen-body">
        <div class="fullscreen-hero">
          <div class="mark" :style="destructive ? { background: 'rgba(184, 74, 60, 0.12)', color: 'var(--accent)' } : {}">
            <UiIcon :name="destructive ? 'delete' : 'save'" :size="32" />
          </div>
          <h2>{{ message }}</h2>
        </div>
      </div>

      <div class="fullscreen-footer">
        <UiButton variant="ghost" :disabled="busy" @click="$emit('cancel')">
          {{ cancelLabel ?? t.common.cancel }}
        </UiButton>
        <UiButton
          :variant="destructive ? 'danger' : 'primary'"
          :disabled="busy"
          @click="$emit('confirm')"
        >
          {{ busy ? t.common.loading : confirmLabel ?? t.common.confirm }}
        </UiButton>
      </div>
    </div>
  </Teleport>
</template>
