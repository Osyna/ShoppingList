import { ref, watch, type Ref } from 'vue'
import { usePersistentRef } from './usePersistentRef'

export type PresentationMode = 'modal' | 'fullscreen'

const MODES: readonly PresentationMode[] = ['modal', 'fullscreen']

function usePersistentBool(key: string, fallback: boolean): Ref<boolean> {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
  const initial = stored === '1' ? true : stored === '0' ? false : fallback
  const value = ref(initial)
  watch(value, (v) => {
    try {
      localStorage.setItem(key, v ? '1' : '0')
    } catch {
      /* ignore */
    }
  })
  return value
}

export function useListPresentation(listId: string): {
  editMode: Ref<PresentationMode>
  deleteMode: Ref<PresentationMode>
  hideChecked: Ref<boolean>
} {
  const editMode = usePersistentRef<PresentationMode>(
    `shoppinglist.list.${listId}.editMode`,
    'modal',
    MODES
  )
  const deleteMode = usePersistentRef<PresentationMode>(
    `shoppinglist.list.${listId}.deleteMode`,
    'modal',
    MODES
  )
  const hideChecked = usePersistentBool(`shoppinglist.list.${listId}.hideChecked`, false)
  return { editMode, deleteMode, hideChecked }
}
