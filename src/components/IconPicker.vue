<script setup>
import AppIcon from './AppIcon.vue'
import { pickerIcons } from '../utils/icons'

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="icon-picker">
    <button
      v-for="ic in pickerIcons" :key="ic"
      class="ip-cell" :class="{ on: modelValue === ic }"
      type="button"
      @click="emit('update:modelValue', ic)"
    >
      <AppIcon :name="ic" :size="20" />
    </button>
  </div>
</template>

<style scoped>
.icon-picker {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
  max-height: 160px; overflow-y: auto;
}
.ip-cell {
  aspect-ratio: 1; border-radius: 12px; background: var(--surface-2);
  display: grid; place-items: center; color: var(--text-dim);
  border: 2px solid transparent;
}
.ip-cell.on { border-color: var(--teal); color: var(--teal); background: color-mix(in srgb, var(--teal) 14%, transparent); }
</style>
