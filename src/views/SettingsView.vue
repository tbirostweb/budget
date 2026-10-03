<script setup>
import { useRouter } from 'vue-router'
import { useFinance } from '../stores/finance'
import { useAuth } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import AppIcon from '../components/AppIcon.vue'

const fin = useFinance()
const auth = useAuth()
const { theme, toggle } = useTheme()
const router = useRouter()

async function logout() {
  await auth.logout()
  router.replace('/login')
}

function resetData() {
  if (confirm('Réinitialiser toutes les données de démo ?')) {
    localStorage.removeItem('finance-state-v2')
    location.reload()
  }
}
</script>

<template>
  <div class="screen">
    <h1>Réglages</h1>

    <div class="card grp" v-if="auth.user">
      <div class="row">
        <div class="icon-badge" style="background:var(--teal);width:38px;height:38px"><AppIcon name="wallet" :size="18" /></div>
        <span class="row-lbl">Compte</span>
        <span class="row-val">{{ auth.user.email }}</span>
      </div>
    </div>

    <div class="card grp">
      <div class="row" @click="toggle">
        <div class="icon-badge" style="background:var(--purple);width:38px;height:38px"><AppIcon :name="theme === 'dark' ? 'moon' : 'sun'" :size="18" /></div>
        <span class="row-lbl">Thème</span>
        <span class="row-val">{{ theme === 'dark' ? 'Sombre' : 'Clair' }}</span>
      </div>
      <div class="row">
        <div class="icon-badge" style="background:var(--teal);width:38px;height:38px"><AppIcon name="wallet" :size="18" /></div>
        <span class="row-lbl">Solde de départ</span>
        <input class="inline-input" type="number" v-model.number="fin.settings.startingBalance" />
      </div>
      <div class="row">
        <div class="icon-badge" style="background:var(--green);width:38px;height:38px"><AppIcon name="banknote" :size="18" /></div>
        <span class="row-lbl">Revenu mensuel</span>
        <input class="inline-input" type="number" v-model.number="fin.settings.monthlyIncome" />
      </div>
    </div>

    <div class="card grp">
      <div class="row" @click="router.push('/bank')">
        <div class="icon-badge" style="background:var(--blue);width:38px;height:38px"><AppIcon name="bank" :size="18" /></div>
        <span class="row-lbl">Connexion bancaire</span>
        <AppIcon name="chevron-right" :size="18" />
      </div>
    </div>

    <button class="logout" @click="logout"><AppIcon name="arrow-up" :size="16" /> Se déconnecter</button>
    <button class="reset" @click="resetData"><AppIcon name="trash" :size="16" /> Réinitialiser les données locales</button>
  </div>
</template>

<style scoped>
h1 { font-size: 28px; font-weight: 800; margin: 6px 0 20px; }
.grp { padding: 6px 16px; margin-bottom: 16px; }
.row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid var(--border); cursor: pointer; }
.row:last-child { border-bottom: none; }
.row-lbl { flex: 1; font-size: 15px; font-weight: 600; }
.row-val { color: var(--text-dim); }
.inline-input { width: 110px; text-align: right; background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; padding: 8px 10px; color: var(--text); font-size: 15px; }
.logout { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border-radius: 14px; background: var(--surface-2); color: var(--text); font-weight: 700; margin-bottom: 12px; }
.logout :deep(svg) { transform: rotate(90deg); }
.reset { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; border-radius: 14px; background: color-mix(in srgb, var(--red) 12%, transparent); color: var(--red); font-weight: 700; }
</style>
