<script setup lang="ts">
import type { ListRulesMap } from '../../types'
import type { RuleConfigField, RuleDefinition } from '../../rules/types'
import UiSwitch from '../../ui/UiSwitch.vue'
import UiInput from '../../ui/UiInput.vue'
import UiSelect from '../../ui/UiSelect.vue'
import UiFormField from '../../ui/UiFormField.vue'
import type { UiSelectOption } from '../../ui/types'

const props = defineProps<{
  def: RuleDefinition
  draft: ListRulesMap
}>()

const emit = defineEmits<{
  (e: 'toggle', enabled: boolean): void
  (e: 'fieldChange', key: string, value: unknown): void
}>()

function fieldValue(field: RuleConfigField) {
  return (
    props.draft[props.def.id]?.config?.[field.key] ?? props.def.defaultConfig?.[field.key]
  )
}

function fieldOptions(field: RuleConfigField): UiSelectOption<string | number>[] {
  return (field.options ?? []).map((o) => ({ value: o.value, label: o.label }))
}
</script>

<template>
  <div class="rule">
    <div class="rule-body">
      <div class="rule-title">{{ def.label }}</div>
      <div class="rule-desc">{{ def.description }}</div>
    </div>
    <UiSwitch
      :model-value="!!draft[def.id]?.enabled"
      :label="def.label"
      @update:model-value="(v) => emit('toggle', v)"
    />
  </div>
  <div v-if="draft[def.id]?.enabled && def.configSchema?.length" class="rule-config">
    <UiFormField
      v-for="field in def.configSchema"
      :key="field.key"
      :label="field.label"
    >
      <UiSelect
        v-if="field.kind === 'select'"
        :model-value="fieldValue(field) as string | number"
        :options="fieldOptions(field)"
        @update:model-value="(v) => emit('fieldChange', field.key, v)"
      />
      <UiInput
        v-else-if="field.kind === 'number'"
        :model-value="fieldValue(field) as number"
        type="number"
        :min="field.min"
        :max="field.max"
        :step="field.step"
        @update:model-value="(v) => emit('fieldChange', field.key, Number(v))"
      />
      <label
        v-else-if="field.kind === 'checkbox'"
        style="display: inline-flex; align-items: center; gap: 8px"
      >
        <input
          type="checkbox"
          class="checkbox"
          :checked="!!fieldValue(field)"
          @change="(e) => emit('fieldChange', field.key, (e.target as HTMLInputElement).checked)"
        />
        <span style="font-size: 13px; color: var(--ink-2)">{{ field.label }}</span>
      </label>
    </UiFormField>
  </div>
</template>
