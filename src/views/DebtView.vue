<script setup>
import { ref, computed } from 'vue'
import { useFinance } from '../stores/finance'
import { money, compact } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'

const fin = useFinance()
const tab = ref('cards')
const strategy = ref('Avalanche')
</script>

<template>
  <div class="screen">
    <div class="overview">
      <div class="section-title">Vue des dettes</div>
      <div class="big-total">{{ compact(fin.totalDebt) }}</div>
      <div class="sub">total en cours</div>
    </div>

    <div class="stat-row">
      <div class="card stat"><div class="stat-num">{{ fin.cardCount }}</div><div class="stat-label">Cartes</div></div>
      <div class="card stat"><div class="stat-num">{{ money(fin.minDueTotal) }}</div><div class="stat-label">Min. dû</div></div>
      <div class="card stat paid"><div class="stat-num check"><AppIcon name="check" :size="22" /></div><div class="stat-label">{{ fin.paidCount }}/{{ fin.cardCount }} Payé</div></div>
    </div>

    <div class="segment tabs">
      <button :class="{ active: tab === 'cards' }" @click="tab = 'cards'">Cartes</button>
      <button :class="{ active: tab === 'debts' }" @click="tab = 'debts'">Dettes <span class="badge">{{ fin.debts.length }}</span></button>
      <button :class="{ active: tab === 'ious' }" @click="tab = 'ious'">IOUs <span class="badge green">+{{ money(fin.iouTotal) }}</span></button>
    </div>

    <div class="strategy-row">
      <span class="strat-lbl">Stratégie de remboursement</span>
      <div class="segment mini">
        <button :class="{ active: strategy === 'Avalanche' }" @click="strategy = 'Avalanche'">Avalanche</button>
        <button :class="{ active: strategy === 'Snowball' }" @click="strategy = 'Snowball'">Snowball</button>
      </div>
    </div>
    <p class="hint">Trié par taux le plus élevé — économise le plus d'intérêts.</p>

    <template v-if="tab === 'cards'">
      <div v-for="card in fin.creditCards" :key="card.id" class="card debt-card" :style="{ borderColor: card.color }">
        <div class="dc-head">
          <div class="icon-badge" :style="{ background: card.color, width: '42px', height: '30px', borderRadius: '7px' }"><AppIcon name="card" :size="18" /></div>
          <span class="dc-name">{{ card.name }}</span>
          <span v-if="card.payFirst" class="tag-first">PAYER EN 1ER</span>
          <button class="checkbox" :class="{ on: card.paid }" @click="card.paid = !card.paid"><AppIcon v-if="card.paid" name="check" :size="15" /></button>
        </div>
        <div class="dc-body">
          <div class="dc-bar-wrap">
            <div class="bar"><span :style="{ width: card.used + '%', background: card.color }"></span></div>
            <span class="dc-used" :style="{ color: card.color }">{{ card.used }}% utilisé</span>
          </div>
          <div class="dc-amount"><div class="dc-bal">{{ money(card.balance) }}</div><div class="dc-limit">sur {{ money(card.limit) }}</div></div>
        </div>
        <div class="dc-foot">
          <span><b>{{ card.apr }}%</b> · Min {{ money(card.minDue) }}</span>
          <span class="pill" :class="card.paid ? 'paid-pill' : 'unpaid'">{{ card.paid ? 'Payé' : 'Non payé' }}</span>
        </div>
      </div>
    </template>

    <template v-else-if="tab === 'debts'">
      <div v-for="d in fin.debts" :key="d.id" class="card debt-card" :style="{ borderColor: d.color }">
        <div class="dc-head">
          <div class="icon-badge" :style="{ background: d.color, width: '42px', height: '30px', borderRadius: '7px' }"><AppIcon name="banknote" :size="18" /></div>
          <span class="dc-name">{{ d.name }}</span>
        </div>
        <div class="dc-foot"><span><b>{{ d.apr }}%</b> · Min {{ money(d.minDue) }}</span><span class="dc-bal">{{ money(d.balance) }}</span></div>
      </div>
    </template>

    <template v-else>
      <div v-for="i in fin.ious" :key="i.id" class="card debt-card" :style="{ borderColor: i.color }">
        <div class="dc-head">
          <div class="icon-badge" :style="{ background: i.color, width: '42px', height: '30px', borderRadius: '7px' }"><AppIcon name="wallet" :size="18" /></div>
          <span class="dc-name">{{ i.name }}</span>
          <span class="dc-bal green" style="margin-left:auto">+{{ money(i.amount) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.overview { margin-top: 8px; }
.big-total { font-size: 50px; font-weight: 800; line-height: 1.05; margin-top: 4px; }
.sub { color: var(--text-dim); font-size: 14px; }

.stat-row { display: flex; gap: 12px; margin: 18px 0; }
.stat { flex: 1; padding: 16px 10px; text-align: center; }
.stat-num { font-size: 20px; font-weight: 700; display: flex; justify-content: center; }
.stat-num.check { color: var(--green); }
.stat-label { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
.stat.paid { border-color: color-mix(in srgb, var(--green) 40%, transparent); background: color-mix(in srgb, var(--green) 8%, var(--surface)); }
.stat.paid .stat-label { color: var(--green); }

.tabs .badge { background: var(--red); color: #fff; border-radius: 999px; padding: 0 7px; font-size: 11px; margin-left: 4px; }
.tabs .badge.green { background: color-mix(in srgb, var(--green) 22%, transparent); color: var(--green); }

.strategy-row { display: flex; align-items: center; justify-content: space-between; margin-top: 22px; gap: 12px; }
.strat-lbl { font-size: 15px; font-weight: 600; }
.segment.mini { padding: 3px; }
.segment.mini button { padding: 7px 12px; font-size: 13px; }
.segment.mini button.active { background: var(--blue); color: #fff; }
.hint { color: var(--text-dim); font-size: 13px; margin: 10px 0 16px; }

.debt-card { padding: 16px; margin-bottom: 12px; border-width: 1px; border-style: solid; }
.dc-head { display: flex; align-items: center; gap: 10px; }
.dc-name { font-size: 17px; font-weight: 700; }
.tag-first { margin-left: auto; color: var(--blue); font-size: 12px; font-weight: 800; }
.checkbox { width: 26px; height: 26px; border-radius: 8px; border: 2px solid var(--blue); background: var(--blue); color: #fff; display: grid; place-items: center; }
.checkbox:not(.on) { background: transparent; }

.dc-body { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 4px; gap: 14px; }
.dc-bar-wrap { flex: 1; }
.dc-used { font-size: 13px; margin-top: 6px; display: block; }
.dc-amount { text-align: right; }
.dc-bal { font-size: 22px; font-weight: 800; }
.dc-bal.green { color: var(--green); }
.dc-limit { font-size: 13px; color: var(--text-dim); }

.dc-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 14px; }
.pill.unpaid { background: color-mix(in srgb, var(--red) 15%, transparent); color: var(--red); padding: 5px 12px; }
.pill.paid-pill { background: color-mix(in srgb, var(--green) 15%, transparent); color: var(--green); padding: 5px 12px; }
</style>
