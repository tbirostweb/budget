<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinance } from '../stores/finance'
import { money, signed, monthName } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'

const fin = useFinance()
const router = useRouter()

const evts = computed(() => fin.eventsForMonth(fin.view.year, fin.view.month))
const income = computed(() => evts.value.filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0))
const expense = computed(() => evts.value.filter(e => e.amount < 0).reduce((a, e) => a + Math.abs(e.amount), 0))
const saved = computed(() => fin.goals.reduce((a, g) => a + g.monthly, 0))
const restToLive = computed(() => income.value - expense.value - saved.value)

const cf = computed(() => fin.cashflow)
const alerts = computed(() => fin.upcomingAlerts.slice(0, 4))

function dayText(d) {
  if (d === 0) return "aujourd'hui"
  if (d === 1) return 'demain'
  return `dans ${d} j`
}
</script>

<template>
  <div class="screen">
    <div class="hello">
      <div class="section-title">{{ monthName(fin.view.month) }} {{ fin.view.year }}</div>
      <h1>Tableau de bord</h1>
    </div>

    <!-- Projection cash-flow -->
    <div class="card projection">
      <div class="proj-head">
        <AppIcon name="trending" :size="18" />
        <span>Projection fin de mois</span>
      </div>
      <div class="proj-amount" :class="{ neg: cf.end < 0 }">{{ money(cf.end) }}</div>
      <div class="proj-sub">
        Point bas prévu : <b>{{ money(cf.lowest) }}</b>
      </div>
    </div>

    <!-- Résumé du mois -->
    <div class="summary-grid">
      <div class="card mini green">
        <AppIcon name="arrow-up" :size="16" />
        <div class="mini-label">Revenus</div>
        <div class="mini-val">{{ money(income) }}</div>
      </div>
      <div class="card mini red">
        <AppIcon name="arrow-down" :size="16" />
        <div class="mini-label">Dépenses</div>
        <div class="mini-val">{{ money(expense) }}</div>
      </div>
      <div class="card mini blue">
        <AppIcon name="savings" :size="16" />
        <div class="mini-label">Épargne</div>
        <div class="mini-val">{{ money(saved) }}</div>
      </div>
      <div class="card mini teal">
        <AppIcon name="wallet" :size="16" />
        <div class="mini-label">Reste à vivre</div>
        <div class="mini-val">{{ money(restToLive) }}</div>
      </div>
    </div>

    <!-- Alertes / échéances à venir -->
    <div class="block-head">
      <span class="section-title">À venir (7 jours)</span>
      <button class="link" @click="router.push('/calendar')">Calendrier</button>
    </div>
    <div v-if="alerts.length === 0" class="empty">Rien de prévu, tout est calme ☀️</div>
    <div v-for="a in alerts" :key="a.id" class="alert-row">
      <div class="icon-badge" :style="{ background: a.color, width: '38px', height: '38px' }">
        <AppIcon :name="a.icon" :size="18" />
      </div>
      <div class="ar-mid">
        <div class="ar-label">
          {{ a.label }}
          <span v-if="a.type === 'installment'" class="chip">{{ a.meta.index }}/{{ a.meta.count }}</span>
        </div>
        <div class="ar-when">{{ dayText(a.daysUntil) }}</div>
      </div>
      <div class="ar-amt">{{ signed(a.amount) }}</div>
    </div>

    <!-- Objectifs -->
    <div class="block-head">
      <span class="section-title">Objectifs</span>
      <button class="link" @click="router.push('/goals')">Tout voir</button>
    </div>
    <div class="goals-strip">
      <button v-for="g in fin.goals" :key="g.id" class="gchip" @click="router.push('/goals')">
        <div class="icon-badge" :style="{ background: g.color, width: '34px', height: '34px' }">
          <AppIcon :name="g.icon" :size="16" />
        </div>
        <div class="gchip-name">{{ g.name }}</div>
        <div class="gchip-pct">{{ Math.round((g.saved / g.target) * 100) }}%</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.hello { margin: 6px 0 18px; }
h1 { font-size: 30px; font-weight: 800; margin-top: 2px; }

.projection { padding: 20px; margin-bottom: 16px; background: linear-gradient(135deg, color-mix(in srgb, var(--teal) 20%, var(--surface)), var(--surface)); }
.proj-head { display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 13px; font-weight: 600; }
.proj-amount { font-size: 40px; font-weight: 800; margin: 8px 0 2px; }
.proj-amount.neg { color: var(--red); }
.proj-sub { font-size: 14px; color: var(--text-dim); }

.summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.mini { padding: 16px; }
.mini-label { font-size: 13px; color: var(--text-dim); margin-top: 8px; }
.mini-val { font-size: 22px; font-weight: 800; margin-top: 2px; }
.mini.green { color: var(--green); }
.mini.red { color: var(--red); }
.mini.blue { color: var(--blue); }
.mini.teal { color: var(--teal); }
.mini-label, .mini-val { color: var(--text); }
.mini.green > svg { color: var(--green); }
.mini.red > svg { color: var(--red); }
.mini.blue > svg { color: var(--blue); }
.mini.teal > svg { color: var(--teal); }

.block-head { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 14px; }
.link { color: var(--teal); font-size: 13px; font-weight: 600; }
.empty { color: var(--text-dim); font-size: 14px; padding: 6px 0 20px; }

.alert-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.ar-mid { flex: 1; }
.ar-label { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 8px; }
.chip { font-size: 11px; font-weight: 700; background: var(--surface-3); border-radius: 999px; padding: 2px 8px; }
.ar-when { font-size: 13px; color: var(--text-dim); margin-top: 2px; }
.ar-amt { font-weight: 700; color: var(--red); }

.goals-strip { display: flex; gap: 12px; overflow-x: auto; margin-top: 4px; padding-bottom: 6px; }
.gchip { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 14px; min-width: 120px; text-align: left; }
.gchip-name { font-size: 14px; font-weight: 600; margin-top: 10px; }
.gchip-pct { font-size: 20px; font-weight: 800; color: var(--teal); margin-top: 2px; }
</style>
