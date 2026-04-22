import { ref } from 'vue'

export function useInlineEdit(onSave: (id: string, value: string) => Promise<void> | void) {
  const editingId = ref<string | null>(null)
  const draft = ref('')

  function start(id: string, current: string) {
    editingId.value = id
    draft.value = current
  }

  function cancel() {
    editingId.value = null
    draft.value = ''
  }

  async function save() {
    const id = editingId.value
    if (!id) return
    const value = draft.value.trim()
    if (!value) {
      cancel()
      return
    }
    try {
      await onSave(id, value)
    } finally {
      cancel()
    }
  }

  return { editingId, draft, start, cancel, save }
}
