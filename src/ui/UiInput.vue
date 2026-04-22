<script setup lang="ts">
import { computed } from 'vue'

type InputType = 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    type?: InputType
    placeholder?: string
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    min?: number | string
    max?: number | string
    step?: number | string
    minlength?: number
    invalid?: boolean
  }>(),
  { type: 'text' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'enter'): void
}>()

const onInput = (event: Event) => {
  const el = event.target as HTMLInputElement
  const value = props.type === 'number' ? (el.value === '' ? 0 : Number(el.value)) : el.value
  emit('update:modelValue', value)
}

const classes = computed(() => ['input', props.invalid ? 'input-invalid' : ''].filter(Boolean).join(' '))
</script>

<template>
  <input
    :type="type"
    :value="modelValue ?? ''"
    :placeholder="placeholder"
    :required="required"
    :disabled="disabled"
    :autocomplete="autocomplete"
    :min="min"
    :max="max"
    :step="step"
    :minlength="minlength"
    :class="classes"
    @input="onInput"
    @keyup.enter="$emit('enter')"
  />
</template>
