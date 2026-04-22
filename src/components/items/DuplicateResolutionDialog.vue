<script setup lang="ts">
import type { Item } from '../../types'
import { useI18n } from '../../i18n'
import UiButton from '../../ui/UiButton.vue'
import UiModal from '../../ui/UiModal.vue'

defineProps<{ open: boolean; duplicates: Item[]; busy?: boolean }>()

defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>()

const t = useI18n()
</script>

<template>
  <UiModal
    :open="open"
    :title="t.rules.duplicatesTitle"
    size="md"
    @close="$emit('cancel')"
  >
    <p style="color: var(--ink-3); font-size: 14px; line-height: 1.5; margin: 0">
      {{ t.rules.duplicatesMessage(duplicates.length) }}
    </p>
    <ul
      style="
        list-style: none;
        margin: 0;
        padding: 12px 14px;
        background: var(--paper-2);
        border-radius: 12px;
        max-height: 200px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13.5px;
      "
    >
      <li
        v-for="d in duplicates"
        :key="d.id"
        style="display: flex; justify-content: space-between; gap: 12px"
      >
        <span
          style="
            flex: 1;
            color: var(--ink);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
        >
          {{ d.name }}
        </span>
        <span style="color: var(--ink-4); font-size: 12px; flex-shrink: 0">
          {{ new Date(d.created).toLocaleDateString() }}
        </span>
      </li>
    </ul>

    <template #footer>
      <UiButton variant="ghost" :disabled="busy" @click="$emit('cancel')">
        {{ t.common.cancel }}
      </UiButton>
      <UiButton variant="danger" :disabled="busy" @click="$emit('confirm')">
        {{ busy ? t.common.loading : t.rules.duplicatesConfirm }}
      </UiButton>
    </template>
  </UiModal>
</template>
