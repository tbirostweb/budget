import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../stores/auth'
import DashboardView from '../views/DashboardView.vue'
import DebtView from '../views/DebtView.vue'
import GoalsView from '../views/GoalsView.vue'
import BudgetView from '../views/BudgetView.vue'
import CalendarView from '../views/CalendarView.vue'
import StatsView from '../views/StatsView.vue'
import BankView from '../views/BankView.vue'
import SettingsView from '../views/SettingsView.vue'
import LoginView from '../views/LoginView.vue'
import LegalView from '../views/LegalView.vue'
import PrivacyView from '../views/PrivacyView.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView },
  { path: '/debt', name: 'debt', component: DebtView },
  { path: '/goals', name: 'goals', component: GoalsView },
  { path: '/budget', name: 'budget', component: BudgetView },
  { path: '/calendar', name: 'calendar', component: CalendarView },
  { path: '/stats', name: 'stats', component: StatsView },
  { path: '/bank', name: 'bank', component: BankView },
  { path: '/settings', name: 'settings', component: SettingsView },
  { path: '/legal', name: 'legal', component: LegalView, meta: { public: true } },
  { path: '/confidentialite', name: 'privacy', component: PrivacyView, meta: { public: true } },
  // Route inconnue -> retour au tableau de bord (évite l'écran vide)
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

// Garde d'authentification
router.beforeEach(async (to) => {
  const auth = useAuth()
  if (!auth.ready) await auth.checkSession()

  if (!auth.isAuthed && !to.meta.public) return { name: 'login' }
  if (auth.isAuthed && to.name === 'login') return { name: 'dashboard' }
})

export default router
