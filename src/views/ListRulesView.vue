<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ListRulesMap, ShoppingList } from '../types'
import { useListsStore } from '../stores/lists'
import { useToast } from '../composables/useToast'
import { useDuplicateResolution } from '../composables/useDuplicateResolution'
import { useListPresentation } from '../composables/useListPresentation'
import { useI18n } from '../i18n'
import { getAllRules } from '../rules/registry'
import { ensureRuleDefinitions } from '../rules/engine'
import type { RuleDefinition } from '../rules/types'
import { computeDuplicatesForNewRules } from '../rules/utils/duplicates'
import { listsRepo, itemsRepo } from '../data/repositories'
import DuplicateResolutionDialog from '../components/items/DuplicateResolutionDialog.vue'
import ListPresentationSection from '../components/lists/ListPresentationSection.vue'
import RuleConfigCard from '../components/rules/RuleConfigCard.vue'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import UiIcon from '../ui/UiIcon.vue'
import UiButton from '../ui/UiButton.vue'
import {
  LIST_ICONS,
  LIST_PALETTE,
  softListColor,
  useListAppearance,
} from '../composables/useListAppearance'

const props = defineProps<{ id: string }>()
const router = useRouter()
const lists = useListsStore()
const { error, success, info } = useToast()
const t = useI18n()

const list = ref<ShoppingList | null>(null)
const draft = ref<ListRulesMap>({})
const defs = ref<RuleDefinition[]>([])

const { editMode, deleteMode, hideChecked } = useListPresentation(props.id)

let configTimer: ReturnType<typeof setTimeout> | null = null

async function loadList() {
  try {
    await ensureRuleDefinitions()
    defs.value = getAllRules()
    list.value = await listsRepo.getOne(props.id)
    const copy: ListRulesMap = {}
    for (const d of defs.value) {
      const stored = list.value.rules?.[d.id]
      copy[d.id] = {
        enabled: !!stored?.enabled,
        config: { ...(d.defaultConfig ?? {}), ...(stored?.config ?? {}) },
      }
    }
    draft.value = copy
  } catch {
    error(t.lists.notFound)
    router.push({ name: 'lists' })
  }
}

onMounted(loadList)

const dedupe = useDuplicateResolution({
  deleteItem: (id) => itemsRepo.remove(id),
  onResolved: async (rules, removed) => {
    info(t.rules.duplicatesRemoved(removed))
    await persistRules(rules)
  },
})

async function persistRules(rules: ListRulesMap) {
  if (!list.value) return
  try {
    const updated = await lists.update(list.value.id, { rules })
    const hasEnabled = Object.values(rules).some((r) => r?.enabled)
    if (hasEnabled && (!updated.rules || Object.keys(updated.rules).length === 0)) {
      error(t.rules.notPersisted)
      return
    }
    list.value = updated
    draft.value = { ...rules }
    success(t.rules.saved)
  } catch {
    error(t.common.networkError)
  }
}

async function commit(next: ListRulesMap) {
  if (!list.value) return
  const prev = list.value.rules ?? {}
  const needsScan =
    (next.unique_strict?.enabled && !prev.unique_strict?.enabled) ||
    (next.unique_fuzzy?.enabled && !prev.unique_fuzzy?.enabled)
  if (needsScan) {
    try {
      const listItems = await itemsRepo.getForList(list.value.id)
      const dupes = computeDuplicatesForNewRules(prev, next, listItems)
      if (dupes.length > 0) {
        dedupe.requestResolution(dupes, next)
        return
      }
    } catch {
      error(t.common.networkError)
      return
    }
  }
  await persistRules(next)
}

function setEnabled(def: RuleDefinition, enabled: boolean) {
  const current = draft.value[def.id] ?? { enabled: false, config: { ...def.defaultConfig } }
  const next = { ...draft.value, [def.id]: { ...current, enabled } }
  draft.value = next
  commit(next)
}

function setField(ruleId: string, key: string, value: unknown) {
  const current = draft.value[ruleId] ?? { enabled: false, config: {} }
  const next = {
    ...draft.value,
    [ruleId]: { ...current, config: { ...(current.config ?? {}), [key]: value } },
  }
  draft.value = next
  if (configTimer) clearTimeout(configTimer)
  configTimer = setTimeout(() => persistRules(next), 400)
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push({ name: 'list-detail', params: { id: props.id } })
}

const listName = computed(() => list.value?.name ?? '')

// Inline appearance editor — same picker surface as the modal, but lives
// in the list's settings page so users can also adjust it from here.
const { appearance, setAppearance } = useListAppearance(props.id)

// Deletion flow for the whole list, triggered from the settings page.
const confirmDelete = ref(false)
const deleting = ref(false)
async function runDelete() {
  if (!list.value) return
  deleting.value = true
  try {
    await lists.remove(list.value.id)
    success('Liste supprimée')
    router.push({ name: 'lists' })
  } catch {
    error(t.common.networkError)
  } finally {
    deleting.value = false
    confirmDelete.value = false
  }
}
</script>

<template>
  <div v-if="list" class="phone-scroll">
    <div class="topbar compact-top">
      <button class="back-chev" :aria-label="t.common.back" @click="goBack">
        <UiIcon name="back" :size="18" />
      </button>
      <div class="title-inline">
        <h1>Paramètres</h1>
      </div>
      <span style="width: 40px" />
    </div>

    <div class="header compact" style="padding: 0 24px 8px">
      <div class="sub">
        <span class="muted">Comportements de</span>
        <span class="pill">{{ listName }}</span>
      </div>
    </div>

    <div class="listwrap" style="padding: 8px 20px 28px">
      <section class="rule-group">
        <h4>Apparence</h4>
        <div class="list-appearance-block">
          <div
            class="list-appearance-inline"
            :style="{
              background: softListColor(appearance.color, 0.14),
              borderColor: softListColor(appearance.color, 0.4),
            }"
          >
            <span
              class="list-appearance-inline-tile"
              :style="{
                background: softListColor(appearance.color, 0.28),
                color: appearance.color,
              }"
            >
              <UiIcon :name="appearance.icon" :size="22" />
            </span>
            <span class="list-appearance-inline-name">{{ listName }}</span>
          </div>

          <div class="list-appearance-field-label">Couleur</div>
          <div class="list-appearance-colors-inline">
            <button
              v-for="c in LIST_PALETTE"
              :key="c"
              type="button"
              class="list-color-pick"
              :class="{ 'is-active': c === appearance.color }"
              :style="{ background: c }"
              :aria-label="c"
              :aria-pressed="c === appearance.color"
              @click="setAppearance({ color: c })"
            />
          </div>

          <div class="list-appearance-field-label">Icône</div>
          <div class="list-appearance-icons-inline">
            <button
              v-for="ic in LIST_ICONS"
              :key="ic"
              type="button"
              class="list-icon-pick"
              :class="{ 'is-active': ic === appearance.icon }"
              :style="
                ic === appearance.icon
                  ? {
                      background: softListColor(appearance.color, 0.22),
                      borderColor: softListColor(appearance.color, 0.55),
                      color: appearance.color,
                    }
                  : {}
              "
              :aria-label="ic"
              :aria-pressed="ic === appearance.icon"
              @click="setAppearance({ icon: ic })"
            >
              <UiIcon :name="ic" :size="18" />
            </button>
          </div>
        </div>
      </section>

      <ListPresentationSection
        :edit-mode="editMode"
        :delete-mode="deleteMode"
        :hide-checked="hideChecked"
        @update:edit-mode="(v) => (editMode = v)"
        @update:delete-mode="(v) => (deleteMode = v)"
        @update:hide-checked="(v) => (hideChecked = v)"
      />

      <div class="rule-group">
        <h4>Règles</h4>
        <RuleConfigCard
          v-for="def in defs"
          :key="def.id"
          :def="def"
          :draft="draft"
          @toggle="(v) => setEnabled(def, v)"
          @field-change="(key, value) => setField(def.id, key, value)"
        />
      </div>

      <p style="text-align: center; color: var(--ink-4); font-size: 12px; padding: 12px 0 4px; margin: 0">
        Les règles s'appliquent uniquement à cette liste.
      </p>

      <section class="rule-group list-danger-zone">
        <h4>Zone dangereuse</h4>
        <div class="list-danger-body">
          <p class="list-danger-copy">
            Supprimer cette liste retire tous les articles qu'elle contient. Cette action est
            irréversible.
          </p>
          <UiButton
            variant="danger"
            icon="delete"
            :disabled="deleting"
            @click="confirmDelete = true"
          >
            {{ t.lists.delete ?? 'Supprimer la liste' }}
          </UiButton>
        </div>
      </section>
    </div>

    <ConfirmDialog
      :open="confirmDelete"
      :title="t.lists.delete ?? 'Supprimer la liste'"
      :message="t.lists.confirmDelete"
      :busy="deleting"
      destructive
      @confirm="runDelete"
      @cancel="confirmDelete = false"
    />

    <DuplicateResolutionDialog
      :open="dedupe.duplicates.value.length > 0"
      :duplicates="dedupe.duplicates.value"
      :busy="dedupe.busy.value"
      @confirm="dedupe.confirm()"
      @cancel="dedupe.cancel()"
    />
  </div>
</template>
