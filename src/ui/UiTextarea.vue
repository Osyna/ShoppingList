<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    rows?: number
    disabled?: boolean
    required?: boolean
  }>(),
  { rows: 2 }
)

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows"
    :disabled="disabled"
    :required="required"
    class="input"
    style="resize: vertical; min-height: 80px; line-height: 1.45;"
    @input="onInput"
  />
</template>
