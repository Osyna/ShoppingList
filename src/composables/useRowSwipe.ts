import { ref } from 'vue'

// Globally-shared id of the row whose swipe actions are revealed. Each
// ItemRow watches this and snaps closed when another row opens, so only one
// row's actions are ever visible at a time.
export const openRowId = ref<string | null>(null)
