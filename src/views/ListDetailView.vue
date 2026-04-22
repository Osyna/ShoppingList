<script setup lang="ts">
import { computed, ref, toRef, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import type { Item, ItemInput } from '../types'
import { useItemsStore } from '../stores/items'
import { useCategoriesStore } from '../stores/categories'
import { useToast } from '../composables/useToast'
import { useListPresentation } from '../composables/useListPresentation'
import { useListDetail } from '../composables/useListDetail'
import { useI18n } from '../i18n'
import ItemForm from '../components/items/ItemForm.vue'
import ItemSearchBar from '../components/items/ItemSearchBar.vue'
import ItemToolbar from '../components/items/ItemToolbar.vue'
import ItemGroup from '../components/items/ItemGroup.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import UiIcon from '../ui/UiIcon.vue'
import UiProgressRing from '../ui/UiProgressRing.vue'

const props = defineProps<{ id: string }>()
const router = useRouter()
const items = useItemsStore()
const categories = useCategoriesStore()
const { success, info } = useToast()
const t = useI18n()

const { editMode, deleteMode, hideChecked } = useListPresentation(props.id)

const {
  list,
  query,
  conflict,
  sortBy,
  groupBy,
  grouped,
  total,
  remaining,
  progress,
  allDone,
  canAdd,
  categoryNameOf,
  colorForItem,
  handleError,
} = useListDetail(toRef(props, 'id'), hideChecked)

const editingItem = ref<Item | null>(null)
const toDelete = ref<string | null>(null)

async function quickAdd() {
  if (!list.value || !canAdd.value) return
  const name = query.value.trim()
  try {
    await items.create(list.value, { name, quantity_value: 1, quantity_unit: 'count' })
    query.value = ''
    success(t.items.created)
  } catch (e) {
    handleError(e)
  }
}

async function onEditSubmit(input: ItemInput) {
  if (!list.value || !editingItem.value) return
  try {
    await items.update(list.value, editingItem.value.id, {
      name: input.name,
      quantity_value: input.quantity_value,
      quantity_unit: input.quantity_unit,
      notes: input.notes ?? '',
      category: input.category ?? null,
      icon: input.icon ?? null,
    } as Partial<Item>)
    info(t.items.updated)
    editingItem.value = null
  } catch (e) {
    handleError(e)
  }
}

async function toggleItem(it: Item) {
  try {
    await items.toggle(it.id)
  } catch (e) {
    handleError(e)
  }
}

async function confirmDelete() {
  if (!toDelete.value) return
  try {
    await items.remove(toDelete.value)
  } catch (e) {
    handleError(e)
  } finally {
    toDelete.value = null
  }
}

function goBack() {
  router.push({ name: 'lists' })
}

function openRules() {
  if (!list.value) return
  router.push({ name: 'list-rules', params: { id: list.value.id } })
}

const subtitle = computed(
  () => `${t.lists.itemCount(remaining.value)} restant${remaining.value > 1 ? 's' : ''}`
)

const scrollEl = useTemplateRef<HTMLElement>('scrollEl')
const showScrollTop = ref(false)

function onScrollableScroll() {
  const el = scrollEl.value
  if (el) showScrollTop.value = el.scrollTop > 320
}

function scrollToTop() {
  scrollEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div v-if="list" ref="scrollEl" class="phone-scroll" @scroll.passive="onScrollableScroll">
    <div class="topbar compact-top">
      <button class="back-chev" :aria-label="t.common.back" @click="goBack">
        <UiIcon name="back" :size="18" />
      </button>
      <div class="title-inline">
        <h1>{{ list.name }}</h1>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 2px">
        <UiProgressRing :value="progress" :size="28" />
        <button class="icon-btn" :aria-label="t.rules.manage" @click="openRules">
          <UiIcon name="settings" :size="18" />
        </button>
      </div>
    </div>

    <div class="header compact" style="padding: 0 24px 8px">
      <div class="sub">
        <span class="muted">{{ subtitle }}</span>
        <span class="muted-2">·</span>
        <span class="muted-2">{{ total }} au total</span>
      </div>
    </div>

    <ItemSearchBar
      v-model="query"
      :conflict="conflict?.message"
      :can-add="canAdd"
      :items="items.items"
      :color-for="colorForItem"
      @quick-add="quickAdd"
      @toggle="toggleItem"
    />

    <ItemToolbar
      :group-by="groupBy"
      :sort-by="sortBy"
      @update:group-by="(v) => (groupBy = v)"
      @update:sort-by="(v) => (sortBy = v)"
    />

    <div class="listwrap">
      <div v-if="allDone" class="done-card">
        <div class="mark">
          <UiIcon name="sparkle" :size="28" />
        </div>
        <h3>Liste terminée ✦</h3>
        <p>Bon appétit. On se revoit pour la prochaine virée.</p>
      </div>

      <div v-if="items.items.length === 0 && !items.loading" class="empty">
        <div class="empty-icon">
          <UiIcon name="cart" :size="24" />
        </div>
        <h3>{{ t.items.empty }}</h3>
        <p>Utilisez le champ ci-dessus pour ajouter un premier article.</p>
      </div>

      <ItemGroup
        v-for="g in grouped"
        :key="g.key"
        :name="g.name"
        :items="g.items"
        :color="g.color"
        :category-name-of="categoryNameOf"
        :color-for="colorForItem"
        @toggle="toggleItem"
        @edit="(it) => (editingItem = it)"
        @delete="(it) => (toDelete = it.id)"
      />
    </div>

    <ItemForm
      :open="editingItem !== null"
      :item="editingItem"
      :categories="categories.categories"
      :mode="editMode"
      @submit="onEditSubmit"
      @cancel="editingItem = null"
    />

    <ConfirmDialog
      :open="toDelete !== null"
      :message="t.items.confirmDelete"
      :mode="deleteMode"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />

    <button
      type="button"
      class="scroll-top-fab"
      :class="{ visible: showScrollTop }"
      :aria-label="'Retour en haut'"
      :tabindex="showScrollTop ? 0 : -1"
      @click="scrollToTop"
    >
      <UiIcon name="back" :size="18" />
    </button>
  </div>
</template>
