<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ label, value, color? }]
  data: { type: Array, default: () => [] },
  height: { type: Number, default: 140 },
  color: { type: String, default: 'var(--teal)' }
})

const max = computed(() => Math.max(1, ...props.data.map((d) => d.value)))
</script>

<template>
  <div class="barchart" :style="{ height: height + 'px' }">
    <div v-for="(d, i) in data" :key="i" class="bc-col">
      <div class="bc-bar-track">
        <div
          class="bc-bar"
          :style="{ height: (d.value / max) * 100 + '%', background: d.color || color }"
        ></div>
      </div>
      <span class="bc-label">{{ d.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.barchart { display: flex; align-items: flex-end; gap: 10px; }
.bc-col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.bc-bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.bc-bar { width: 100%; border-radius: 8px 8px 3px 3px; min-height: 4px; transition: height 0.5s ease; }
.bc-label { font-size: 11px; color: var(--text-dim); margin-top: 8px; }
</style>
