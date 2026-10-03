<script setup>
import { computed } from 'vue'
import { useFinance } from '../stores/finance'
import { money, monthShort } from '../utils/format'
import DonutChart from '../components/DonutChart.vue'
import BarChart from '../components/BarChart.vue'
import AppIcon from '../components/AppIcon.vue'

const fin = useFinance()

const spent = computed(() => fin.spentByCategory)
const breakdown = computed(() =>
  fin.categories
    .filter(c => c.id !== 'inc' && (spent.value[c.id] || 0) > 0)
    .map(c => ({ label: c.name, value: spent.value[c.id] || 0, color: c.color, icon: c.icon }))
    .sort((a, b) => b.value - a.value)
)
const totalSpent = computed(() => breakdown.value.reduce((a, d) => a + d.value, 0))

// Tendance des 6 derniers mois (dépenses)
const trend = computed(() => {
  const arr = []
  for (let i = 5; i >= 0; i--) {
    let m = fin.view.month - i
    let y = fin.view.year
    while (m < 0) { m += 12; y-- }
    const evts = fin.eventsForMonth(y, m)
    const val = evts.filter(e => e.amount < 0).reduce((a, e) => a + Math.abs(e.amount), 0)
    arr.push({ label: monthShort(m), value: val })
  }
  return arr
})

// Épargne cumulée (objectifs)
const savedCumul = computed(() => fin.goals.reduce((a, g) => a + g.saved, 0))
</script>

<template>
  <div class="screen">
    <h1>Statistiques</h1>

    <div class="card block">
      <div class="block-title">Dépenses par catégorie</div>
      <DonutChart :data="breakdown" :size="190">
        <template #centerTop>{{ money(totalSpent) }}</template>
        <template #centerBottom>ce mois-ci</template>
      </DonutChart>
      <div class="legend">
        <div v-for="d in breakdown" :key="d.label" class="lg-row">
          <span class="dot" :style="{ background: d.color }"></span>
          <span class="lg-name">{{ d.label }}</span>
          <span class="lg-val">{{ money(d.value) }}</span>
        </div>
        <div v-if="breakdown.length === 0" class="empty">Aucune dépense ce mois-ci.</div>
      </div>
    </div>

    <div class="card block">
      <div class="block-title">Dépenses — 6 derniers mois</div>
      <BarChart :data="trend" color="var(--blue)" />
    </div>

    <div class="card block savings">
      <div>
        <div class="block-title" style="margin:0">Épargne cumulée</div>
        <div class="sv-sub">Sur tous tes objectifs</div>
      </div>
      <div class="sv-amount"><AppIcon name="savings" :size="20" /> {{ money(savedCumul) }}</div>
    </div>
  </div>
</template>

<style scoped>
h1 { font-size: 28px; font-weight: 800; margin: 6px 0 18px; }
.block { padding: 20px; margin-bottom: 16px; }
.block-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.legend { margin-top: 18px; }
.lg-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; }
.dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.lg-name { flex: 1; font-size: 14px; }
.lg-val { font-weight: 700; font-size: 14px; }
.empty { color: var(--text-dim); font-size: 14px; }
.savings { display: flex; align-items: center; justify-content: space-between; }
.sv-sub { color: var(--text-dim); font-size: 13px; margin-top: 2px; }
.sv-amount { display: flex; align-items: center; gap: 8px; font-size: 24px; font-weight: 800; color: var(--teal); }
</style>
