<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCategoriesStore } from '../stores/categories'
import { useToast } from '../composables/useToast'
import { useInlineEdit } from '../composables/useInlineEdit'
import { useI18n } from '../i18n'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import CategoryRow from '../components/categories/CategoryRow.vue'
import UiIcon from '../ui/UiIcon.vue'
import UiButton from '../ui/UiButton.vue'

const categories = useCategoriesStore()
const { error, success } = useToast()
const t = useI18n()
const router = useRouter()

const toDelete = ref<string | null>(null)
const creating = ref(false)
const newName = ref('')

const inlineEdit = useInlineEdit(async (id, name) => {
  try {
    await categories.rename(id, name)
  } catch {
    error(t.common.networkError)
  }
})

async function createCategory() {
  const name = newName.value.trim()
  if (!name) return
  creating.value = true
  try {
    await categories.create(name)
    success(t.categories.created)
    newName.value = ''
  } catch {
    error(t.common.networkError)
  } finally {
    creating.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await categories.remove(toDelete.value)
  } catch {
    error(t.common.networkError)
  } finally {
    toDelete.value = null
  }
}

</script>

<template>
  <div class="phone-scroll">
    <div class="topbar compact-top">
      <button class="back-chev" :aria-label="t.common.back" @click="router.push('/')">
        <UiIcon name="back" :size="18" />
      </button>
      <div class="title-inline">
        <h1>{{ t.categories.title }}</h1>
      </div>
      <span style="width: 40px" />
    </div>

    <div class="listwrap" style="padding: 8px 20px 28px">
      <form
        class="search"
        style="margin-bottom: 12px"
        @submit.prevent="createCategory"
      >
        <UiIcon name="plus" :size="16" />
        <input
          v-model="newName"
          type="text"
          :placeholder="t.categories.newPlaceholder"
          :aria-label="t.categories.newPlaceholder"
        />
        <UiButton
          size="sm"
          variant="primary"
          type="submit"
          :disabled="creating || !newName.trim()"
        >
          {{ t.categories.add }}
        </UiButton>
      </form>

      <div v-if="categories.categories.length === 0" class="empty">
        <div class="empty-icon">
          <UiIcon name="tag" :size="22" />
        </div>
        <p>{{ t.categories.empty }}</p>
      </div>

      <div v-else class="rule-group">
        <CategoryRow
          v-for="c in categories.categories"
          :key="c.id"
          :category="c"
          :editing="inlineEdit.editingId.value === c.id"
          @start-rename="inlineEdit.start(c.id, c.name)"
          @cancel-rename="inlineEdit.cancel()"
          @rename="(v) => { inlineEdit.draft.value = v; inlineEdit.save() }"
          @delete="toDelete = c.id"
        />
      </div>
    </div>

    <ConfirmDialog
      :open="toDelete !== null"
      :message="t.categories.confirmDelete"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>
