import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { Item } from '../types'
import { normalizeLoose } from '../rules/utils/normalize'

/**
 * State + behavior for an autocomplete search bar over a list of items:
 *   - reactive query / match list
 *   - focus tracking with outside-click dismissal
 *   - scoring (exact > prefix > contains, ties broken by length)
 *
 * The composable is wiring only; the component owns the DOM & markup.
 * Pass template refs for the wrapper + input so focus + outside-click work.
 */
export function useItemSearch(options: {
  query: Ref<string>
  items: Ref<Item[]>
  rootEl: Ref<HTMLElement | null>
  inputEl: Ref<HTMLInputElement | null>
}) {
  const { query, items, rootEl, inputEl } = options
  const focused = ref(false)

  function onDocumentPointerDown(event: PointerEvent) {
    const target = event.target as Node | null
    if (target && rootEl.value?.contains(target)) return
    focused.value = false
    if (inputEl.value && document.activeElement === inputEl.value) {
      inputEl.value.blur()
    }
  }

  watch(focused, (v) => {
    if (v) document.addEventListener('pointerdown', onDocumentPointerDown, true)
    else document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true)
  })

  const trimmed = computed(() => query.value.trim())

  function scoreItem(item: Item, nq: string): number {
    const name = normalizeLoose(item.name)
    if (!name.includes(nq)) return -1
    if (name === nq) return 1000
    if (name.startsWith(nq)) return 500 - (name.length - nq.length)
    return 100 - (name.length - nq.length)
  }

  const matches = computed(() => {
    const q = trimmed.value
    if (!q) return []
    const nq = normalizeLoose(q)
    const scored = items.value
      .map((i) => ({ item: i, score: scoreItem(i, nq) }))
      .filter((x) => x.score >= 0)
      .sort(
        (a, b) =>
          b.score - a.score || Number(a.item.checked) - Number(b.item.checked)
      )
    return scored.map((x) => x.item)
  })

  return {
    focused,
    trimmed,
    matches,
    onFocus: () => (focused.value = true),
  }
}
