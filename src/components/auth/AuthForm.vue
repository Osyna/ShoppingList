<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../i18n'
import UiButton from '../../ui/UiButton.vue'
import UiFormField from '../../ui/UiFormField.vue'
import UiInput from '../../ui/UiInput.vue'

export interface AuthFormField {
  key: 'name' | 'email' | 'password' | 'passwordConfirm'
  label: string
  type: 'text' | 'email' | 'password'
  autocomplete: string
  required?: boolean
  minlength?: number
}

export interface AuthFormPayload {
  name: string
  email: string
  password: string
  passwordConfirm: string
}

const props = defineProps<{
  fields: AuthFormField[]
  submitLabel: string
  loading?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', payload: AuthFormPayload): void }>()

const t = useI18n()

const state = ref<AuthFormPayload>({
  name: '',
  email: '',
  password: '',
  passwordConfirm: '',
})

function onSubmit() {
  emit('submit', { ...state.value })
}
</script>

<template>
  <form class="card" style="padding: 22px; display: flex; flex-direction: column; gap: 14px" @submit.prevent="onSubmit">
    <UiFormField v-for="f in props.fields" :key="f.key" :label="f.label">
      <UiInput
        v-model="state[f.key]"
        :type="f.type"
        :autocomplete="f.autocomplete"
        :required="f.required"
        :minlength="f.minlength"
      />
    </UiFormField>
    <UiButton type="submit" variant="primary" block :loading="loading" :disabled="loading">
      {{ loading ? t.common.loading : submitLabel }}
    </UiButton>
  </form>
</template>
