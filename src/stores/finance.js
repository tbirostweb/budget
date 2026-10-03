import { defineStore } from 'pinia'
import { addMonths, daysInMonth, iso, today, diffDays } from '../utils/date'
import { api } from '../services/api'

const STORAGE_KEY = 'finance-state-v2'

// Contrôle de la synchro serveur (hors state pour ne pas être persistés)
let saveTimer = null
let loadingFromServer = false

// ---------------------------------------------------------------------------
// État par défaut (données de démo en euros, alignées sur le mois d'août 2026)
// ---------------------------------------------------------------------------
function defaultState() {
  return {
    settings: {
      startingBalance: 1475,
      monthlyIncome: 2400
    },
    // Mois affiché par le calendrier / le budget
    view: { year: 2026, month: 7 }, // month 0-indexé : 7 = août

    categories: [
      { id: 'c1', name: 'Transport', icon: 'car', color: '#3b82f6', planned: 148 },
      { id: 'c2', name: 'Énergie', icon: 'utilities', color: '#5b6cff', planned: 148 },
      { id: 'c3', name: 'Santé', icon: 'health', color: '#ff4d5e', planned: 147 },
      { id: 'c4', name: 'Alimentation', icon: 'food', color: '#f2c94c', planned: 300 },
      { id: 'c5', name: 'Loisirs', icon: 'entertainment', color: '#8b5cf6', planned: 40 },
      { id: 'c6', name: 'Logement', icon: 'home', color: '#a37a5c', planned: 900 },
      { id: 'c7', name: 'Courses', icon: 'groceries', color: '#f0932b', planned: 200 },
      { id: 'c8', name: 'Abonnements', icon: 'repeat', color: '#14c8a0', planned: 160 },
      { id: 'inc', name: 'Revenu', icon: 'banknote', color: '#16b364', planned: 0 }
    ],

    // Dépenses / revenus récurrents (#6)
    recurring: [
      { id: 'r1', label: 'Loyer', icon: 'home', color: '#a37a5c', amount: -900, categoryId: 'c6', frequency: 'monthly', day: 30, startDate: '2026-01-30', active: true },
      { id: 'r2', label: 'Netflix', icon: 'entertainment', color: '#8b5cf6', amount: -20, categoryId: 'c5', frequency: 'monthly', day: 25, startDate: '2026-01-25', active: true },
      { id: 'r3', label: 'Assurance auto', icon: 'car', color: '#3b82f6', amount: -68, categoryId: 'c1', frequency: 'monthly', day: 31, startDate: '2026-01-31', active: true },
      { id: 'r4', label: 'Forfait mobile', icon: 'phone', color: '#5b6cff', amount: -25, categoryId: 'c8', frequency: 'monthly', day: 31, startDate: '2026-01-31', active: true },
      { id: 'r5', label: 'Essence', icon: 'fuel', color: '#3b82f6', amount: -80, categoryId: 'c1', frequency: 'monthly', day: 30, startDate: '2026-01-30', active: true },
      { id: 'r6', label: 'Spotify', icon: 'music', color: '#14c8a0', amount: -10, categoryId: 'c8', frequency: 'monthly', day: 5, startDate: '2026-01-05', active: true },
      { id: 'r7', label: 'Salaire', icon: 'banknote', color: '#16b364', amount: 2400, categoryId: 'inc', frequency: 'monthly', day: 28, startDate: '2026-01-28', active: true }
    ],

    // Paiements fractionnés 3x / 4x (#7)
    installments: [
      { id: 'i1', label: 'MacBook Air', icon: 'laptop', color: '#8b5cf6', total: 1200, count: 4, day: 15, startDate: '2026-07-15', categoryId: 'c5' },
      { id: 'i2', label: 'Billets Hawaii', icon: 'plane', color: '#3b82f6', total: 900, count: 3, day: 2, startDate: '2026-08-02', categoryId: 'c5' }
    ],

    // Dépenses ponctuelles
    transactions: [
      { id: 't1', date: '2026-08-06', label: 'Restaurant', icon: 'food', color: '#f2c94c', amount: -35, categoryId: 'c4' },
      { id: 't2', date: '2026-08-08', label: 'Pharmacie', icon: 'pill', color: '#ff4d5e', amount: -22, categoryId: 'c3' },
      { id: 't3', date: '2026-08-09', label: 'Courses', icon: 'groceries', color: '#f0932b', amount: -54, categoryId: 'c7' },
      { id: 't4', date: '2026-08-04', label: 'Café', icon: 'coffee', color: '#a37a5c', amount: -6, categoryId: 'c4' }
    ],

    // Objectifs d'épargne (#11)
    goals: [
      { id: 'g1', name: 'Nouvelle voiture', icon: 'car', color: '#3b82f6', target: 8000, saved: 1200, monthly: 300, targetDate: '2028-06-01' },
      { id: 'g2', name: 'Fonds d\'urgence', icon: 'shield', color: '#ff4d5e', target: 5000, saved: 3600, monthly: 200, targetDate: '2027-03-01' },
      { id: 'g3', name: 'Voyage Hawaii', icon: 'plane', color: '#f0932b', target: 3000, saved: 1240, monthly: 150, targetDate: '2027-01-01' },
      { id: 'g4', name: 'Nouveau laptop', icon: 'laptop', color: '#8b5cf6', target: 2000, saved: 850, monthly: 100, targetDate: '2027-02-01' }
    ],

    creditCards: [
      { id: 'cc1', name: 'Carte Visa SG', color: '#5b6cff', apr: 0, used: 12, limit: 4000, balance: 500, minDue: 25, paid: false, payFirst: true }
    ],
    debts: [
      { id: 'd1', name: 'Prêt étudiant', color: '#f0932b', apr: 4.5, balance: 9000, minDue: 120, paid: false }
    ],
    ious: [
      { id: 'io1', name: 'Alex', color: '#16b364', amount: 500, direction: 'in' }
    ]
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

export const useFinance = defineStore('finance', {
  state: () => loadState(),

  getters: {
    categoryById: (s) => (id) => s.categories.find((c) => c.id === id),

    netWorth: (s) => s.settings.startingBalance,

    totalDebt(s) {
      return s.creditCards.reduce((a, c) => a + c.balance, 0) +
        s.debts.reduce((a, d) => a + d.balance, 0)
    },
    cardCount: (s) => s.creditCards.length,
    minDueTotal: (s) =>
      s.creditCards.reduce((a, c) => a + c.minDue, 0) + s.debts.reduce((a, d) => a + d.minDue, 0),
    paidCount: (s) => s.creditCards.filter((c) => c.paid).length,
    iouTotal: (s) => s.ious.reduce((a, i) => a + (i.direction === 'in' ? i.amount : -i.amount), 0),

    // ---- Moteur de génération d'événements pour un mois ----
    eventsForMonth: (s) => (year, month) => {
      const out = []
      const dim = daysInMonth(year, month)
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month, dim, 23, 59)

      // Récurrents
      for (const r of s.recurring) {
        if (!r.active) continue
        const start = new Date(r.startDate)
        if (r.frequency === 'monthly') {
          const d = new Date(year, month, Math.min(r.day, dim))
          if (d >= new Date(iso(start))) {
            out.push(makeEvent(r, d, 'recurring'))
          }
        } else if (r.frequency === 'weekly') {
          let d = new Date(start)
          while (d < monthStart) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
          while (d <= monthEnd) {
            out.push(makeEvent(r, new Date(d), 'recurring'))
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)
          }
        } else if (r.frequency === 'yearly') {
          if (start.getMonth() === month) {
            out.push(makeEvent(r, new Date(year, month, Math.min(start.getDate(), dim)), 'recurring'))
          }
        }
      }

      // Paiements fractionnés
      for (const p of s.installments) {
        const per = -Math.round(p.total / p.count)
        for (let i = 0; i < p.count; i++) {
          const d = addMonths(new Date(p.startDate), i)
          if (d.getFullYear() === year && d.getMonth() === month) {
            out.push({
              id: `${p.id}-${i}`,
              date: d,
              day: d.getDate(),
              label: p.label,
              amount: per,
              color: p.color,
              icon: p.icon,
              categoryId: p.categoryId,
              type: 'installment',
              meta: { index: i + 1, count: p.count }
            })
          }
        }
      }

      // Ponctuels
      for (const t of s.transactions) {
        const d = new Date(t.date)
        if (d.getFullYear() === year && d.getMonth() === month) {
          out.push(makeEvent(t, d, t.amount >= 0 ? 'income' : 'oneoff'))
        }
      }

      return out.sort((a, b) => a.date - b.date)
    },

    // ---- Dépenses par catégorie pour le mois affiché ----
    spentByCategory(s) {
      const evts = this.eventsForMonth(s.view.year, s.view.month)
      const map = {}
      for (const e of evts) {
        if (e.amount >= 0) continue
        map[e.categoryId] = (map[e.categoryId] || 0) + Math.abs(e.amount)
      }
      return map
    },

    budgetTotals(s) {
      const spent = this.spentByCategory
      const totalPlanned = s.categories.reduce((a, c) => a + c.planned, 0)
      const totalSpent = Object.values(spent).reduce((a, v) => a + v, 0)
      return { planned: totalPlanned, spent: totalSpent, remaining: totalPlanned - totalSpent }
    },

    // ---- Projection de solde (#9) ----
    cashflow(s) {
      const evts = this.eventsForMonth(s.view.year, s.view.month)
      const now = today()
      let balance = s.settings.startingBalance
      let lowest = balance
      const points = []
      for (const e of evts) {
        if (e.date < new Date(iso(now))) continue // déjà passé
        balance += e.amount
        if (balance < lowest) lowest = balance
        points.push({ date: e.date, balance })
      }
      const end = points.length ? points[points.length - 1].balance : balance
      return { end, lowest, points, start: s.settings.startingBalance }
    },

    // ---- Alertes des 7 prochains jours (#8) ----
    upcomingAlerts(s) {
      const evts = this.eventsForMonth(s.view.year, s.view.month)
      const now = today()
      return evts
        .map((e) => ({ ...e, daysUntil: diffDays(now, e.date) }))
        .filter((e) => e.daysUntil >= 0 && e.daysUntil <= 7 && e.amount < 0)
        .sort((a, b) => a.daysUntil - b.daysUntil)
    },

    // Prochaines échéances de paiements fractionnés (toutes dates)
    installmentSchedule: (s) => {
      const list = []
      for (const p of s.installments) {
        const per = -Math.round(p.total / p.count)
        const now = today()
        for (let i = 0; i < p.count; i++) {
          const d = addMonths(new Date(p.startDate), i)
          list.push({ id: `${p.id}-${i}`, plan: p, date: d, index: i + 1, count: p.count, amount: per, past: d < new Date(iso(now)) })
        }
      }
      return list.filter((x) => !x.past).sort((a, b) => a.date - b.date)
    }
  },

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
    },

    // Charge les données du serveur ; si vide, y pousse l'état local actuel
    async loadFromServer() {
      try {
        const { data } = await api.getData()
        if (data) {
          loadingFromServer = true
          this.$patch(data)
          loadingFromServer = false
        } else {
          await this.saveToServerNow()
        }
      } catch {
        loadingFromServer = false
      }
    },

    // Sauvegarde différée (anti-spam) déclenchée à chaque modification
    scheduleSave() {
      if (loadingFromServer) return
      clearTimeout(saveTimer)
      saveTimer = setTimeout(() => this.saveToServerNow(), 800)
    },

    async saveToServerNow() {
      try { await api.saveData(this.$state) } catch { /* non connecté : ignoré */ }
    },
    setView(year, month) {
      this.view = { year, month }
    },
    shiftMonth(delta) {
      let m = this.view.month + delta
      let y = this.view.year
      if (m < 0) { m = 11; y-- }
      if (m > 11) { m = 0; y++ }
      this.view = { year: y, month: m }
    },
    addTransaction(tx) {
      this.transactions.push({ id: 't' + Date.now(), ...tx })
    },
    addRecurring(r) {
      this.recurring.push({ id: 'r' + Date.now(), active: true, ...r })
    },
    addInstallment(p) {
      this.installments.push({ id: 'i' + Date.now(), ...p })
    },
    addGoal(g) {
      this.goals.push({ id: 'g' + Date.now(), saved: 0, ...g })
    },
    contributeGoal(id, amount) {
      const g = this.goals.find((x) => x.id === id)
      if (g) g.saved = Math.min(g.target, g.saved + amount)
    },
    removeGoal(id) {
      this.goals = this.goals.filter((g) => g.id !== id)
    },
    addCategory(c) {
      this.categories.push({ id: 'c' + Date.now(), planned: 0, ...c })
    },
    updateCategory(id, patch) {
      const c = this.categories.find((x) => x.id === id)
      if (c) Object.assign(c, patch)
    },
    removeCategory(id) {
      this.categories = this.categories.filter((c) => c.id !== id)
    }
  }
})

function makeEvent(src, date, type) {
  return {
    id: src.id + '-' + iso(date),
    date,
    day: date.getDate(),
    label: src.label,
    amount: src.amount,
    color: src.color,
    icon: src.icon,
    categoryId: src.categoryId,
    type
  }
}
