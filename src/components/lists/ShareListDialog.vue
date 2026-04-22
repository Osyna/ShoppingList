<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { AuthUser, ShoppingList } from '../../types'
import { useI18n } from '../../i18n'
import { useListsStore, ShareError } from '../../stores/lists'
import { useToast } from '../../composables/useToast'
import UiModal from '../../ui/UiModal.vue'
import UiInput from '../../ui/UiInput.vue'
import UiButton from '../../ui/UiButton.vue'

const props = defineProps<{
  open: boolean
  list: ShoppingList | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'updated', list: ShoppingList): void }>()

const t = useI18n()
const lists = useListsStore()
const { success, error } = useToast()

const email = ref('')
const busy = ref(false)
const members = ref<AuthUser[]>([])
const ownerEmail = ref<string | null>(null)

async function refreshMembers() {
  if (!props.list) return
  try {
    members.value = await lists.listMembers(props.list.id)
  } catch {
    members.value = []
  }
}

watch(() => props.open, (v) => v && refreshMembers())
onMounted(refreshMembers)

function translateShareError(code: string): string {
  return (
    (t.share.errors as Record<string, string | undefined>)[code] ?? t.common.error
  )
}

async function invite() {
  if (!props.list) return
  const v = email.value.trim()
  if (!v) return
  busy.value = true
  try {
    const updated = await lists.addMemberByEmail(props.list.id, v)
    email.value = ''
    success(t.share.added)
    emit('updated', updated)
    await refreshMembers()
  } catch (e) {
    if (e instanceof ShareError) error(translateShareError(e.code))
    else error(t.common.networkError)
  } finally {
    busy.value = false
  }
}

async function kick(userId: string) {
  if (!props.list) return
  try {
    const updated = await lists.removeMember(props.list.id, userId)
    success(t.share.removed)
    emit('updated', updated)
    await refreshMembers()
  } catch {
    error(t.common.networkError)
  }
}

// Owner email is stored as an id on the list; we look it up lazily for display.
watch(
  () => props.list?.user,
  async (ownerId) => {
    if (!ownerId) {
      ownerEmail.value = null
      return
    }
    // Best-effort: fall back to the raw id if the lookup fails.
    try {
      const u = await lists.listMembers(props.list!.id)
      ownerEmail.value = u.find((m) => m.id === ownerId)?.email ?? null
    } catch {
      ownerEmail.value = null
    }
  },
  { immediate: true }
)

const close = () => emit('close')
</script>

<template>
  <UiModal :open="open" @close="close()">
    <template #header>
      <h2 class="modal-title">{{ t.share.title }}</h2>
      <p class="modal-subtitle">{{ t.share.description }}</p>
    </template>

    <form style="display: flex; gap: 8px" @submit.prevent="invite">
      <UiInput
        v-model="email"
        type="email"
        :placeholder="t.share.emailPlaceholder"
        required
        autocomplete="email"
      />
      <UiButton variant="primary" type="submit" :disabled="busy">
        {{ t.share.invite }}
      </UiButton>
    </form>

    <section style="margin-top: 16px">
      <h3 class="form-field-label">{{ t.share.members }}</h3>
      <ul v-if="members.length" class="ac-scroll" style="padding: 4px 0">
        <li
          v-for="m in members"
          :key="m.id"
          style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0"
        >
          <span>{{ m.name || m.email }}</span>
          <UiButton size="sm" variant="ghost" @click="kick(m.id)">{{ t.lists.delete }}</UiButton>
        </li>
      </ul>
      <p v-else class="muted" style="margin: 8px 0 0">{{ t.share.noMembers }}</p>
    </section>

    <template #footer>
      <UiButton variant="ghost" @click="close()">{{ t.common.cancel }}</UiButton>
    </template>
  </UiModal>
</template>
