<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useListsStore } from '../stores/lists'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { useInlineEdit } from '../composables/useInlineEdit'
import { usePersistentRef } from '../composables/usePersistentRef'
import { useI18n } from '../i18n'
import { frCompare, byCreatedDesc, byRecencyDesc } from '../utils/compare'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import ListRow from '../components/lists/ListRow.vue'
import { defineAsyncComponent } from 'vue'
// Share dialog is only needed when the user opens it; keep it out of the
// main ListsView chunk to preserve the fast first paint.
const ShareListDialog = defineAsyncComponent(
  () => import('../components/lists/ShareListDialog.vue')
)
// Same story for the appearance picker — modal, rarely opened.
const ListAppearanceDialog = defineAsyncComponent(
  () => import('../components/lists/ListAppearanceDialog.vue')
)
import type { ShoppingList } from '../types'
import UiIcon from '../ui/UiIcon.vue'
import UiInput from '../ui/UiInput.vue'
import UiButton from '../ui/UiButton.vue'

const lists = useListsStore()
const auth = useAuthStore()
const router = useRouter()
const { error, success } = useToast()
const t = useI18n()

type SortKey = 'updated' | 'created' | 'name'
const sortBy = usePersistentRef<SortKey>(
  'shoppinglist.lists.sort',
  'updated',
  ['updated', 'created', 'name']
)

const sortedLists = computed(() => {
  const arr = [...lists.lists]
  if (sortBy.value === 'name') arr.sort((a, b) => frCompare(a.name, b.name))
  else if (sortBy.value === 'created') arr.sort(byCreatedDesc)
  else arr.sort(byRecencyDesc)
  return arr
})

const creating = ref(false)
const newListName = ref('')
const showNewListForm = ref(false)
const toDelete = ref<string | null>(null)
const shareTarget = ref<ShoppingList | null>(null)
const appearanceTarget = ref<ShoppingList | null>(null)

const inlineEdit = useInlineEdit(async (id, name) => {
  try {
    await lists.rename(id, name)
  } catch {
    error(t.common.networkError)
  }
})

async function submitNewList() {
  const name = newListName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await lists.create(name)
    success(t.lists.created)
    newListName.value = ''
    showNewListForm.value = false
  } catch {
    error(t.common.networkError)
  } finally {
    creating.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await lists.remove(toDelete.value)
  } catch {
    error(t.common.networkError)
  } finally {
    toDelete.value = null
  }
}

function openRules(listId: string) {
  router.push({ name: 'list-rules', params: { id: listId } })
}

function goCategories() {
  router.push({ name: 'categories' })
}

function logout() {
  auth.logout()
  router.push({ name: 'login' })
}

const greeting = computed(() => {
  const name = auth.user?.name || auth.user?.email?.split('@')[0]
  return name ? `Bonjour, ${name}` : 'Bonjour'
})

const totalLists = computed(() => lists.lists.length)
</script>

<template>
  <div class="phone-scroll">
    <div class="topbar">
      <button type="button" class="pill pill-btn" @click="goCategories">
        <UiIcon name="tag" :size="12" />
        {{ t.nav.categories }}
      </button>
      <button
        type="button"
        class="icon-btn"
        :aria-label="t.nav.logout"
        :title="t.nav.logout"
        @click="logout"
      >
        <UiIcon name="logout" :size="18" />
      </button>
    </div>

    <div class="header">
      <div class="eyebrow">{{ greeting }}</div>
      <h1>{{ t.lists.title }}</h1>
      <div class="sub">
        <span class="pill">
          <UiIcon name="sparkle" :size="12" />
          {{ totalLists }} {{ totalLists === 1 ? 'liste' : 'listes' }}
        </span>
        <span class="muted-2">·</span>
        <span class="muted-2">Une liste par virée, ou par envie.</span>
      </div>
    </div>

    <div class="listwrap listwrap--lists">
      <button
        v-if="!showNewListForm"
        type="button"
        class="list-card-add"
        @click="showNewListForm = true"
      >
        <UiIcon name="plus" :size="16" /> {{ t.lists.newPlaceholder }}
      </button>

      <form
        v-else
        class="list-card"
        style="display: flex; gap: 8px; align-items: center"
        @submit.prevent="submitNewList"
      >
        <UiInput
          v-model="newListName"
          :placeholder="t.lists.newPlaceholder"
          required
          autofocus
          @enter="submitNewList"
          @keyup.escape="() => { showNewListForm = false; newListName = '' }"
        />
        <UiButton size="sm" variant="primary" type="submit" :disabled="creating">
          {{ t.lists.create }}
        </UiButton>
        <UiButton
          size="sm"
          variant="ghost"
          type="button"
          @click="() => { showNewListForm = false; newListName = '' }"
        >
          {{ t.common.cancel }}
        </UiButton>
      </form>

      <div v-if="lists.lists.length === 0 && !lists.loading" class="empty">
        <div class="empty-icon">
          <UiIcon name="cart" :size="24" />
        </div>
        <h3>{{ t.lists.empty }}</h3>
      </div>

      <ListRow
        v-for="l in sortedLists"
        :key="l.id"
        :list="l"
        :editing="inlineEdit.editingId.value === l.id"
        @start-rename="inlineEdit.start(l.id, l.name)"
        @cancel-rename="inlineEdit.cancel()"
        @rename="(v) => { inlineEdit.draft.value = v; inlineEdit.save() }"
        @delete="toDelete = l.id"
        @rules="openRules(l.id)"
        @share="shareTarget = l"
        @appearance="appearanceTarget = l"
      />
    </div>

    <ConfirmDialog
      :open="toDelete !== null"
      :message="t.lists.confirmDelete"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />

    <ShareListDialog
      :open="shareTarget !== null"
      :list="shareTarget"
      @close="shareTarget = null"
      @updated="(l) => (shareTarget = l)"
    />

    <ListAppearanceDialog
      :list="appearanceTarget"
      @close="appearanceTarget = null"
    />
  </div>
</template>
