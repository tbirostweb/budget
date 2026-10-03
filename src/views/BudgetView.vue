<script setup>
import { ref, reactive, computed } from 'vue'
import { useFinance } from '../stores/finance'
import { money, monthName } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import BottomSheet from '../components/BottomSheet.vue'
import IconPicker from '../components/IconPicker.vue'

const fin = useFinance()

const totals = computed(() => fin.budgetTotals)
const spent = computed(() => fin.spentByCategory)
const cats = computed(() => fin.categories.filter(c => c.id !== 'inc'))

function pct(c) {
  if (!c.planned) return 0
  return Math.min(100, Math.round(((spent.value[c.id] || 0) / c.planned) * 100))
}

// Édition / création de catégorie
const editing = ref(false)
const form = reactive({ id: null, name: '', planned: '', icon: 'wallet', color: '#14c8a0' })
const palette = ['#3b82f6', '#5b6cff', '#8b5cf6', '#ff4d5e', '#f0932b', '#eab308', '#16b364', '#14c8a0', '#c94f8a', '#a37a5c']

function openNew() {
  Object.assign(form, { id: null, name: '', planned: '', icon: 'wallet', color: '#14c8a0' })
  editing.value = true
}
function openEdit(c) {
  Object.assign(form, { id: c.id, name: c.name, planned: c.planned, icon: c.icon, color: c.color })
  editing.value = true
}
function save() {
  if (!form.name) return
  const payload = { name: form.name, planned: Number(form.planned) || 0, icon: form.icon, color: form.color }
  if (form.id) fin.updateCategory(form.id, payload)
  else fin.addCategory(payload)
  editing.value = false
}
function remove() {
  if (form.id) fin.removeCategory(form.id)
  editing.value = false
}
</script>

<template>
  <div class="screen">
    <div class="month-nav">
      <button class="chev" @click="fin.shiftMonth(-1)"><AppIcon name="chevron-left" :size="18" /></button>
      <div class="month-pill"><AppIcon name="calendar" :size="15" /> {{ monthName(fin.view.month) }} {{ fin.view.year }}</div>
      <button class="chev" @click="fin.shiftMonth(1)"><AppIcon name="chevron-right" :size="18" /></button>
    </div>

    <div class="summary-row">
      <div class="card sum blue"><div class="sum-label">Budget</div><div class="sum-val" style="color:var(--blue)">{{ money(totals.planned) }}</div></div>
      <div class="card sum purple"><div class="sum-label">Dépensé</div><div class="sum-val" style="color:var(--purple)">{{ money(totals.spent) }}</div></div>
      <div class="card sum green"><div class="sum-label">Restant</div><div class="sum-val" style="color:var(--green)">{{ money(totals.remaining) }}</div></div>
    </div>

    <div class="cat-header">
      <span class="section-title">Catégories</span>
      <button class="add-cat" @click="openNew"><AppIcon name="plus" :size="15" /> Ajouter</button>
    </div>

    <div v-for="c in cats" :key="c.id" class="cat" @click="openEdit(c)">
      <div class="cat-top">
        <div class="icon-badge" :style="{ background: c.color, width: '42px', height: '42px' }"><AppIcon :name="c.icon" :size="20" /></div>
        <span class="cat-name">{{ c.name }}</span>
        <span class="cat-amount" :style="{ color: (spent[c.id] || 0) > 0 ? c.color : 'var(--text-dim)' }">
          {{ money(spent[c.id] || 0) }} <span class="dim">/ {{ money(c.planned) }}</span>
        </span>
      </div>
      <div class="bar cat-bar"><span :style="{ width: pct(c) + '%', background: c.color }"></span></div>
      <div class="cat-foot">{{ pct(c) }}% utilisé</div>
    </div>

    <!-- Feuille d'édition catégorie -->
    <BottomSheet :open="editing" :title="form.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'" @close="editing = false">
      <label class="fld"><span>Nom</span><input v-model="form.name" placeholder="Ex : Sport" /></label>
      <label class="fld"><span>Budget mensuel (€)</span><input v-model="form.planned" inputmode="decimal" placeholder="0" /></label>
      <div class="fld"><span>Couleur</span>
        <div class="palette">
          <button v-for="col in palette" :key="col" class="swatch" :class="{ on: form.color === col }" :style="{ background: col }" @click="form.color = col"></button>
        </div>
      </div>
      <div class="fld"><span>Icône</span><IconPicker v-model="form.icon" /></div>
      <div class="actions">
        <button v-if="form.id" class="del" @click="remove"><AppIcon name="trash" :size="18" /></button>
        <button class="save" @click="save">Enregistrer</button>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.month-nav { display: flex; align-items: center; justify-content: space-between; margin: 6px 0 18px; }
.chev { width: 38px; height: 38px; border-radius: 50%; background: var(--surface-2); display: grid; place-items: center; }
.month-pill { display: flex; align-items: center; gap: 6px; background: var(--surface-2); border-radius: 999px; padding: 8px 16px; font-weight: 600; font-size: 14px; }

.summary-row { display: flex; gap: 12px; margin-bottom: 22px; }
.sum { flex: 1; padding: 16px 12px; }
.sum.blue { background: color-mix(in srgb, var(--blue) 12%, var(--surface)); border-color: color-mix(in srgb, var(--blue) 30%, transparent); }
.sum.purple { background: color-mix(in srgb, var(--purple) 12%, var(--surface)); border-color: color-mix(in srgb, var(--purple) 30%, transparent); }
.sum.green { background: color-mix(in srgb, var(--green) 12%, var(--surface)); border-color: color-mix(in srgb, var(--green) 30%, transparent); }
.sum-label { font-size: 13px; color: var(--text-dim); }
.sum-val { font-size: 22px; font-weight: 800; margin-top: 6px; }

.cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.add-cat { display: flex; align-items: center; gap: 5px; color: var(--teal); font-size: 13px; font-weight: 700; }

.cat { padding: 14px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.cat-top { display: flex; align-items: center; gap: 12px; }
.cat-name { font-size: 17px; font-weight: 700; flex: 1; }
.cat-amount { font-size: 14px; font-weight: 700; background: var(--surface-2); padding: 7px 12px; border-radius: 999px; }
.cat-amount .dim { color: var(--text-dim); font-weight: 500; }
.cat-bar { margin: 12px 0 8px; }
.cat-foot { font-size: 13px; color: var(--text-dim); }

.fld { display: block; margin-bottom: 16px; }
.fld > span { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
.fld input { width: 100%; padding: 13px 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 16px; }
.palette { display: flex; gap: 10px; flex-wrap: wrap; }
.swatch { width: 34px; height: 34px; border-radius: 50%; border: 3px solid transparent; }
.swatch.on { border-color: var(--text); }
.actions { display: flex; gap: 12px; margin-top: 8px; }
.del { width: 52px; border-radius: 14px; background: color-mix(in srgb, var(--red) 16%, transparent); color: var(--red); display: grid; place-items: center; }
.save { flex: 1; padding: 15px; border-radius: 14px; background: var(--teal); color: #04150f; font-weight: 800; font-size: 16px; }
</style>
