<script setup>
import { ref, computed } from 'vue'
import { useFinance } from '../stores/finance'
import { money } from '../utils/format'
import { today } from '../utils/date'
import AppIcon from '../components/AppIcon.vue'
import BottomSheet from '../components/BottomSheet.vue'

const fin = useFinance()

function pct(g) { return Math.min(100, Math.round((g.saved / g.target) * 100)) }
function remaining(g) { return Math.max(0, g.target - g.saved) }
function monthsLeft(g) {
  if (!g.monthly) return null
  return Math.ceil(remaining(g) / g.monthly)
}
function reachText(g) {
  const m = monthsLeft(g)
  if (m === null) return 'Sans échéance'
  if (m === 0) return 'Objectif atteint 🎉'
  const d = today()
  d.setMonth(d.getMonth() + m)
  const mm = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']
  return `Atteint en ${mm[d.getMonth()]} ${d.getFullYear()} · ${m} mois`
}

// Contribution ponctuelle
const contribOpen = ref(false)
const target = ref(null)
const amount = ref('')
function openContrib(g) { target.value = g; amount.value = String(g.monthly); contribOpen.value = true }
function doContrib() {
  fin.contributeGoal(target.value.id, parseFloat(amount.value) || 0)
  contribOpen.value = false
}

const totalSaved = computed(() => fin.goals.reduce((a, g) => a + g.saved, 0))
const totalMonthly = computed(() => fin.goals.reduce((a, g) => a + g.monthly, 0))
</script>

<template>
  <div class="screen">
    <div class="head">
      <h1>Objectifs</h1>
      <div class="head-sub">{{ money(totalSaved) }} épargnés · {{ money(totalMonthly) }}/mois</div>
    </div>

    <!-- Anneaux -->
    <div class="rings">
      <div v-for="g in fin.goals" :key="g.id" class="ring-item">
        <div class="ring" :style="{ '--p': pct(g), '--c': g.color }">
          <div class="icon-badge" :style="{ background: g.color, width: '34px', height: '34px' }"><AppIcon :name="g.icon" :size="16" /></div>
        </div>
        <span class="ring-label">{{ pct(g) }}%</span>
      </div>
    </div>

    <div v-for="g in fin.goals" :key="g.id" class="card goal">
      <div class="g-head">
        <div class="icon-badge" :style="{ background: g.color, width: '44px', height: '44px' }"><AppIcon :name="g.icon" :size="22" /></div>
        <div class="g-title">
          <div class="g-name">{{ g.name }}</div>
          <div class="g-away">{{ reachText(g) }}</div>
        </div>
        <button class="trash" @click="fin.removeGoal(g.id)"><AppIcon name="trash" :size="18" /></button>
      </div>

      <div class="g-amount">
        <span class="g-saved">{{ money(g.saved) }}</span>
        <span class="g-target">sur {{ money(g.target) }}</span>
      </div>

      <div class="g-bar">
        <div class="bar"><span :style="{ width: pct(g) + '%', background: g.color }"></span></div>
        <span class="g-pct">{{ pct(g) }}%</span>
      </div>

      <div class="g-foot">
        <span><AppIcon name="repeat" :size="14" /> {{ money(g.monthly) }}/mois · reste {{ money(remaining(g)) }}</span>
        <button class="contrib-btn" @click="openContrib(g)" :style="{ background: g.color }">+ Ajouter</button>
      </div>
    </div>

    <BottomSheet :open="contribOpen" title="Alimenter l'objectif" @close="contribOpen = false">
      <p class="cb-name" v-if="target">{{ target.name }}</p>
      <label class="fld"><span>Montant (€)</span><input v-model="amount" inputmode="decimal" /></label>
      <button class="save" @click="doContrib">Valider</button>
    </BottomSheet>
  </div>
</template>

<style scoped>
.head { margin: 6px 0 18px; }
h1 { font-size: 28px; font-weight: 800; }
.head-sub { color: var(--text-dim); font-size: 14px; margin-top: 4px; }

.rings { display: flex; gap: 16px; overflow-x: auto; padding: 4px 0 18px; }
.ring-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; }
.ring {
  width: 58px; height: 58px; border-radius: 50%;
  background: radial-gradient(closest-side, var(--bg) 74%, transparent 75%), conic-gradient(var(--c) calc(var(--p) * 1%), var(--surface-3) 0);
  display: grid; place-items: center;
}
.ring-label { font-size: 12px; color: var(--text-dim); }

.goal { padding: 18px; margin-bottom: 14px; }
.g-head { display: flex; align-items: center; gap: 12px; }
.g-title { flex: 1; }
.g-name { font-size: 18px; font-weight: 700; }
.g-away { color: var(--text-dim); font-size: 13px; margin-top: 2px; }
.trash { color: var(--text-dim); }

.g-amount { margin: 14px 0 12px; }
.g-saved { font-size: 26px; font-weight: 800; }
.g-target { color: var(--text-dim); font-size: 15px; margin-left: 8px; }

.g-bar { display: flex; align-items: center; gap: 12px; }
.g-bar .bar { flex: 1; }
.g-pct { font-size: 14px; font-weight: 600; }

.g-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border); color: var(--text-dim); font-size: 13px; gap: 10px; }
.g-foot > span { display: flex; align-items: center; gap: 5px; }
.contrib-btn { color: #fff; font-weight: 700; font-size: 13px; padding: 8px 14px; border-radius: 999px; flex-shrink: 0; }

.cb-name { font-size: 17px; font-weight: 700; margin-bottom: 14px; }
.fld { display: block; margin-bottom: 16px; }
.fld > span { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
.fld input { width: 100%; padding: 13px 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 16px; }
.save { width: 100%; padding: 15px; border-radius: 14px; background: var(--teal); color: #04150f; font-weight: 800; font-size: 16px; }
</style>
