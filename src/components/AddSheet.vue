<script setup>
import { ref, reactive } from 'vue'
import { useFinance } from '../stores/finance'
import { useAddSheet } from '../composables/useAddSheet'
import { today, iso } from '../utils/date'
import BottomSheet from './BottomSheet.vue'
import IconPicker from './IconPicker.vue'
import AppIcon from './AppIcon.vue'

const fin = useFinance()
const sheet = useAddSheet()

const kinds = [
  { key: 'expense', label: 'Dépense', icon: 'arrow-down' },
  { key: 'income', label: 'Revenu', icon: 'arrow-up' },
  { key: 'recurring', label: 'Récurrent', icon: 'repeat' },
  { key: 'installment', label: 'Fractionné', icon: 'card' },
  { key: 'goal', label: 'Objectif', icon: 'target' }
]
const kind = ref('expense')

const form = reactive({
  label: '',
  amount: '',
  categoryId: 'c4',
  icon: 'food',
  date: iso(today()),
  day: 1,
  count: 3,
  target: '',
  monthly: '',
  targetDate: '2027-01-01',
  color: '#14c8a0'
})

function reset() {
  form.label = ''; form.amount = ''; form.target = ''; form.monthly = ''
}

function pickCatColor() {
  const c = fin.categoryById(form.categoryId)
  return c ? c.color : form.color
}

function submit() {
  const amt = parseFloat(String(form.amount).replace(',', '.')) || 0
  const color = pickCatColor()
  if (kind.value === 'expense' || kind.value === 'income') {
    if (!form.label) return
    fin.addTransaction({
      date: form.date, label: form.label, icon: form.icon, color,
      amount: kind.value === 'income' ? Math.abs(amt) : -Math.abs(amt),
      categoryId: kind.value === 'income' ? 'inc' : form.categoryId
    })
  } else if (kind.value === 'recurring') {
    fin.addRecurring({
      label: form.label, icon: form.icon, color,
      amount: -Math.abs(amt), categoryId: form.categoryId,
      frequency: 'monthly', day: Number(form.day), startDate: form.date
    })
  } else if (kind.value === 'installment') {
    fin.addInstallment({
      label: form.label, icon: form.icon, color,
      total: Math.abs(amt), count: Number(form.count),
      day: Number(form.day), startDate: form.date, categoryId: form.categoryId
    })
  } else if (kind.value === 'goal') {
    fin.addGoal({
      name: form.label, icon: form.icon, color,
      target: Math.abs(parseFloat(form.target) || 0),
      monthly: Math.abs(parseFloat(form.monthly) || 0),
      targetDate: form.targetDate, saved: 0
    })
  }
  reset()
  sheet.hide()
}
</script>

<template>
  <BottomSheet :open="sheet.open.value" title="Ajouter" @close="sheet.hide()">
    <div class="kinds">
      <button v-for="k in kinds" :key="k.key" class="kind" :class="{ on: kind === k.key }" @click="kind = k.key">
        <AppIcon :name="k.icon" :size="18" />
        <span>{{ k.label }}</span>
      </button>
    </div>

    <label class="fld">
      <span>{{ kind === 'goal' ? 'Nom de l\'objectif' : 'Libellé' }}</span>
      <input v-model="form.label" placeholder="Ex : Courses, Loyer, Voiture…" />
    </label>

    <template v-if="kind !== 'goal'">
      <label class="fld">
        <span>{{ kind === 'installment' ? 'Montant total' : 'Montant (€)' }}</span>
        <input v-model="form.amount" inputmode="decimal" placeholder="0" />
      </label>
    </template>

    <template v-else>
      <div class="row2">
        <label class="fld"><span>Objectif (€)</span><input v-model="form.target" inputmode="decimal" placeholder="8000" /></label>
        <label class="fld"><span>Par mois (€)</span><input v-model="form.monthly" inputmode="decimal" placeholder="300" /></label>
      </div>
    </template>

    <template v-if="kind !== 'goal' && kind !== 'income'">
      <label class="fld">
        <span>Catégorie</span>
        <select v-model="form.categoryId">
          <option v-for="c in fin.categories.filter(c => c.id !== 'inc')" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>
    </template>

    <div class="row2" v-if="kind === 'installment'">
      <label class="fld">
        <span>Nombre de fois</span>
        <select v-model="form.count"><option :value="2">2x</option><option :value="3">3x</option><option :value="4">4x</option><option :value="10">10x</option></select>
      </label>
      <label class="fld"><span>1re échéance</span><input type="date" v-model="form.date" /></label>
    </div>

    <div class="row2" v-else-if="kind === 'recurring'">
      <label class="fld"><span>Jour du mois</span><input v-model="form.day" inputmode="numeric" placeholder="1" /></label>
      <label class="fld"><span>À partir du</span><input type="date" v-model="form.date" /></label>
    </div>

    <label class="fld" v-else-if="kind === 'expense' || kind === 'income'">
      <span>Date</span><input type="date" v-model="form.date" />
    </label>

    <label class="fld" v-if="kind === 'goal'">
      <span>Date cible</span><input type="date" v-model="form.targetDate" />
    </label>

    <div class="fld">
      <span>Icône</span>
      <IconPicker v-model="form.icon" />
    </div>

    <button class="submit" @click="submit">Ajouter</button>
  </BottomSheet>
</template>

<style scoped>
.kinds { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 18px; padding-bottom: 2px; }
.kind {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 10px 14px; border-radius: 14px; background: var(--surface-2);
  color: var(--text-dim); font-size: 12px; font-weight: 600; flex-shrink: 0;
}
.kind.on { background: color-mix(in srgb, var(--teal) 16%, transparent); color: var(--teal); }

.fld { display: block; margin-bottom: 14px; }
.fld > span { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 600; }
.fld input, .fld select {
  width: 100%; padding: 13px 14px; border-radius: 13px; background: var(--surface-2);
  border: 1px solid var(--border); color: var(--text); font-size: 16px;
}
.row2 { display: flex; gap: 12px; }
.row2 .fld { flex: 1; }
.submit {
  width: 100%; padding: 15px; border-radius: 14px; background: var(--teal);
  color: #04150f; font-weight: 800; font-size: 16px; margin-top: 6px;
}
</style>
