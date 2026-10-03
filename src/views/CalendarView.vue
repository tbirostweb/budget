<script setup>
import { computed } from 'vue'
import { useFinance } from '../stores/finance'
import { monthGrid, today, sameDay } from '../utils/date'
import { monthName, weekdays, money, signed } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'

const fin = useFinance()

const grid = computed(() => monthGrid(fin.view.year, fin.view.month))
const evts = computed(() => fin.eventsForMonth(fin.view.year, fin.view.month))
const cf = computed(() => fin.cashflow)
const now = today()

function eventsForDay(date) {
  return evts.value.filter(e => sameDay(e.date, date))
}
function isToday(date) { return sameDay(date, now) }
</script>

<template>
  <div class="screen cal-screen">
    <!-- Bannière projection -->
    <div class="card weather" :class="{ warn: cf.lowest < 0 }">
      <AppIcon :name="cf.lowest < 0 ? 'trending-down' : 'sun'" :size="24" />
      <div class="w-txt">
        <div class="w-title">{{ cf.lowest < 0 ? 'Attention découvert' : 'Ciel dégagé' }}</div>
        <div class="w-sub">
          Fin de mois estimée à <b>{{ money(cf.end) }}</b> · point bas {{ money(cf.lowest) }}
        </div>
      </div>
    </div>

    <!-- Navigation mois -->
    <div class="month-nav">
      <button class="chev" @click="fin.shiftMonth(-1)"><AppIcon name="chevron-left" :size="20" /></button>
      <div class="month-lbl">{{ monthName(fin.view.month) }} {{ fin.view.year }}</div>
      <button class="chev" @click="fin.shiftMonth(1)"><AppIcon name="chevron-right" :size="20" /></button>
    </div>

    <div class="cal-head">
      <div v-for="d in weekdays" :key="d" class="dow">{{ d }}</div>
    </div>

    <div class="cal-grid">
      <template v-for="(week, wi) in grid" :key="wi">
        <div v-for="(cell, ci) in week" :key="ci" class="day" :class="{ outside: cell.outside, today: isToday(cell.date) }">
          <div class="day-num">{{ cell.date.getDate() }}</div>
          <div class="events">
            <div
              v-for="e in eventsForDay(cell.date)" :key="e.id"
              class="event"
              :style="{ background: e.color + '2e', borderColor: e.color }"
            >
              <span class="ev-name"><AppIcon :name="e.icon" :size="9" /> {{ e.label }}</span>
              <span class="ev-amt" :class="{ pos: e.amount > 0 }">{{ signed(e.amount) }}</span>
              <span v-if="e.type === 'installment'" class="ev-inst">{{ e.meta.index }}/{{ e.meta.count }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.cal-screen { padding-left: 10px; padding-right: 10px; }
.weather {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; margin: 6px 6px 16px;
  background: color-mix(in srgb, var(--green) 14%, var(--surface)); border-color: color-mix(in srgb, var(--green) 40%, transparent);
  color: var(--green);
}
.weather.warn { background: color-mix(in srgb, var(--red) 14%, var(--surface)); border-color: color-mix(in srgb, var(--red) 40%, transparent); color: var(--red); }
.w-txt { color: var(--text); }
.w-title { font-weight: 700; font-size: 16px; }
.w-sub { font-size: 13px; color: var(--text-dim); }

.month-nav { display: flex; align-items: center; justify-content: space-between; margin: 0 6px 12px; }
.month-lbl { font-weight: 800; font-size: 17px; }
.chev { width: 40px; height: 40px; border-radius: 50%; background: var(--surface-2); display: grid; place-items: center; }

.cal-head { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.dow { font-size: 11px; color: var(--text-dim); padding-bottom: 6px; }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.day { min-height: 92px; border-top: 1px solid var(--border); padding-top: 4px; }
.day.outside { opacity: 0.35; }
.day-num { font-size: 13px; text-align: center; margin-bottom: 4px; }
.day.today .day-num { background: var(--teal); color: #04150f; border-radius: 999px; width: 22px; height: 22px; line-height: 22px; margin: 0 auto 4px; font-weight: 700; }

.events { display: flex; flex-direction: column; gap: 3px; }
.event { border-radius: 6px; border: 1px solid; padding: 3px 4px; font-size: 9px; line-height: 1.25; position: relative; overflow: hidden; }
.ev-name { display: flex; align-items: center; gap: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ev-amt { font-weight: 700; display: block; }
.ev-amt.pos { color: var(--green); }
.ev-inst { position: absolute; top: 2px; right: 3px; font-size: 8px; opacity: 0.8; font-weight: 700; }
</style>
