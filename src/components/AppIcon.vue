<script setup>
import { computed } from 'vue'
import { iconRegistry } from '../utils/icons'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
  strokeWidth: { type: [Number, String], default: 2 }
})

const cmp = computed(() => iconRegistry[props.name] || iconRegistry.fallback)
</script>

<template>
  <component :is="cmp" :size="Number(size)" :stroke-width="Number(strokeWidth)" />
</template>
