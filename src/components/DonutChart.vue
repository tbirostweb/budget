<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ label, value, color }]
  data: { type: Array, default: () => [] },
  size: { type: Number, default: 180 },
  thickness: { type: Number, default: 22 }
})

const total = computed(() => props.data.reduce((a, d) => a + d.value, 0) || 1)
const radius = computed(() => (props.size - props.thickness) / 2)
const circ = computed(() => 2 * Math.PI * radius.value)

const segments = computed(() => {
  let offset = 0
  return props.data.map((d) => {
    const frac = d.value / total.value
    const seg = { ...d, dash: frac * circ.value, offset: offset * circ.value }
    offset += frac
    return seg
  })
})
</script>

<template>
  <div class="donut-wrap">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <g :transform="`rotate(-90 ${size / 2} ${size / 2})`">
        <circle
          v-for="(s, i) in segments" :key="i"
          :cx="size / 2" :cy="size / 2" :r="radius"
          fill="none" :stroke="s.color" :stroke-width="thickness"
          :stroke-dasharray="`${s.dash} ${circ - s.dash}`"
          :stroke-dashoffset="-s.offset"
        />
      </g>
      <text :x="size / 2" :y="size / 2 - 4" text-anchor="middle" class="donut-center">
        <slot name="centerTop" />
      </text>
      <text :x="size / 2" :y="size / 2 + 16" text-anchor="middle" class="donut-sub">
        <slot name="centerBottom" />
      </text>
    </svg>
  </div>
</template>

<style scoped>
.donut-wrap { display: grid; place-items: center; }
.donut-center { fill: var(--text); font-size: 22px; font-weight: 800; }
.donut-sub { fill: var(--text-dim); font-size: 12px; }
</style>
