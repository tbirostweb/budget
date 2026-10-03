<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchInstitutions, startConnection, fetchAccounts, fetchTransactions, categorize, detectSubscriptions } from '../services/bank'
import { useFinance } from '../stores/finance'
import { moneyPrecise, money, dayLabel } from '../utils/format'
import AppIcon from '../components/AppIcon.vue'
import BottomSheet from '../components/BottomSheet.vue'

const fin = useFinance()
const status = ref('pick')       // pick | connecting | connected | error
const selectedBank = ref(null)   // banque choisie -> ouvre le parcours
const country = ref('FR')
const search = ref('')
const banks = ref([])
const loadingBanks = ref(false)
const accounts = ref([])
const rawTx = ref([])
const error = ref('')
const added = ref({})

const countries = [
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'BE', label: '🇧🇪 Belgique' },
  { code: 'DE', label: '🇩🇪 Allemagne' },
  { code: 'ES', label: '🇪🇸 Espagne' },
  { code: 'IT', label: '🇮🇹 Italie' },
  { code: 'GB', label: '🇬🇧 Royaume-Uni' }
]

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return banks.value
  return banks.value.filter(b => b.name.toLowerCase().includes(q))
})

const transactions = computed(() => rawTx.value.map(t => ({ ...t, ...categorize(t.label) })))
const subscriptions = computed(() => detectSubscriptions(rawTx.value))

async function loadBanks() {
  loadingBanks.value = true
  error.value = ''
  try {
    banks.value = await fetchInstitutions(country.value)
  } catch (e) {
    error.value = e.message
  } finally {
    loadingBanks.value = false
  }
}

// Ouvre le parcours explicatif pour la banque choisie
function chooseBank(bank) {
  selectedBank.value = bank
}

async function connect(bank) {
  selectedBank.value = null
  status.value = 'connecting'
  error.value = ''
  try {
    const { link, requisitionId } = await startConnection(bank.id)
    // Vrai lien de consentement -> redirection vers la banque ; sinon (démo) on charge direct
    if (link && link.startsWith('http')) { window.location.href = link; return }
    accounts.value = await fetchAccounts(requisitionId)
    rawTx.value = await fetchTransactions(accounts.value[0]?.id)
    status.value = 'connected'
  } catch (e) {
    error.value = e.message
    status.value = 'pick'
  }
}

function initials(name) {
  return name.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function addAsRecurring(sub) {
  fin.addRecurring({
    label: sub.label, icon: 'repeat', color: '#14c8a0',
    amount: sub.amount, categoryId: 'c8', frequency: 'monthly',
    day: 5, startDate: '2026-08-05'
  })
  added.value[sub.label] = true
}

onMounted(loadBanks)
</script>

<template>
  <div class="screen">
    <div class="section-title" style="margin:8px 0 16px">Connexion bancaire</div>

    <!-- Choix de la banque -->
    <template v-if="status === 'pick' || status === 'connecting'">
      <div class="secure-note">
        <AppIcon name="shield" :size="18" />
        <span>Connexion sécurisée <b>Open Banking (DSP2)</b>. Tu t'authentifies directement sur le site de ta banque — tes identifiants ne passent jamais par cette app.</span>
      </div>

      <div class="controls">
        <select v-model="country" @change="loadBanks" class="country">
          <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
        </select>
        <div class="search">
          <input v-model="search" placeholder="Rechercher ta banque…" />
        </div>
      </div>

      <p v-if="loadingBanks" class="muted">Chargement des banques…</p>
      <p v-if="error" class="err">{{ error }}</p>

      <div class="bank-list">
        <button
          v-for="b in filtered" :key="b.id"
          class="bank-item"
          :disabled="status === 'connecting'"
          @click="chooseBank(b)"
        >
          <img v-if="b.logo" :src="b.logo" alt="" class="bank-logo-img" />
          <div v-else class="bank-logo-fallback">{{ initials(b.name) }}</div>
          <span class="bank-name">{{ b.name }}</span>
          <AppIcon name="chevron-right" :size="18" />
        </button>
        <p v-if="!loadingBanks && filtered.length === 0" class="muted">Aucune banque trouvée.</p>
      </div>

      <p class="note">Mode démo : la connexion charge des données fictives. Branche GoCardless pour le réel.</p>
    </template>

    <!-- Connecté -->
    <template v-else-if="status === 'connected'">
      <div v-for="a in accounts" :key="a.id" class="card account">
        <div class="acc-top"><span class="acc-name">{{ a.name }}</span><span class="acc-bal">{{ moneyPrecise(a.balance) }}</span></div>
        <div class="acc-iban">{{ a.iban }}</div>
      </div>

      <div v-if="subscriptions.length" class="detect">
        <div class="section-title" style="margin:22px 0 12px">Abonnements détectés</div>
        <div v-for="s in subscriptions" :key="s.label" class="sub-row">
          <div class="icon-badge" style="background:var(--teal);width:38px;height:38px"><AppIcon name="repeat" :size="18" /></div>
          <div class="sub-mid">
            <div class="sub-label">{{ s.label }}</div>
            <div class="sub-meta">{{ money(Math.abs(s.amount)) }}/mois · vu {{ s.count }}×</div>
          </div>
          <button v-if="!added[s.label]" class="sub-add" @click="addAsRecurring(s)">Suivre</button>
          <span v-else class="sub-done"><AppIcon name="check" :size="16" /></span>
        </div>
      </div>

      <div class="section-title" style="margin:22px 0 12px">Transactions</div>
      <div v-for="t in transactions" :key="t.id" class="tx">
        <div class="icon-badge" :style="{ background: t.amount > 0 ? 'var(--green)' : 'var(--surface-3)', width: '38px', height: '38px' }">
          <AppIcon :name="t.icon" :size="18" />
        </div>
        <div class="tx-left">
          <div class="tx-label">{{ t.label }}</div>
          <div class="tx-date">{{ dayLabel(t.date) }} · {{ t.category }}</div>
        </div>
        <div class="tx-amt" :class="{ pos: t.amount > 0 }">{{ moneyPrecise(t.amount) }}</div>
      </div>
    </template>

    <!-- Parcours de connexion à la banque choisie -->
    <BottomSheet :open="!!selectedBank" :title="`Connecter ${selectedBank?.name || ''}`" @close="selectedBank = null">
      <p class="guide-intro">Voici ce qui va se passer — <b>en toute sécurité</b> :</p>

      <ol class="steps">
        <li>
          <span class="num">1</span>
          <div>
            <b>Redirection vers ta banque</b>
            <p>Tu vas être envoyé sur le site officiel de <b>{{ selectedBank?.name }}</b>.</p>
          </div>
        </li>
        <li>
          <span class="num">2</span>
          <div>
            <b>Tu t'identifies chez ta banque</b>
            <p>Avec tes identifiants habituels (ou ton appli / SMS). <b>Cette app ne les voit jamais.</b></p>
          </div>
        </li>
        <li>
          <span class="num">3</span>
          <div>
            <b>Tu autorises l'accès en lecture seule</b>
            <p>Uniquement le solde et les transactions. Aucun virement possible.</p>
          </div>
        </li>
        <li>
          <span class="num">4</span>
          <div>
            <b>Retour automatique ici</b>
            <p>Tes comptes se synchronisent. À renouveler ~tous les 90 jours (obligation légale).</p>
          </div>
        </li>
      </ol>

      <div class="guide-secure">
        <AppIcon name="shield" :size="16" />
        <span>Via GoCardless, prestataire agréé DSP2. Connexion chiffrée.</span>
      </div>

      <button class="guide-btn" @click="connect(selectedBank)">
        Continuer vers {{ selectedBank?.name }}
        <AppIcon name="chevron-right" :size="18" />
      </button>
    </BottomSheet>
  </div>
</template>

<style scoped>
.secure-note { display: flex; gap: 10px; align-items: flex-start; background: color-mix(in srgb, var(--teal) 10%, var(--surface)); border: 1px solid color-mix(in srgb, var(--teal) 30%, transparent); color: var(--text-dim); border-radius: 16px; padding: 14px; font-size: 13px; line-height: 1.5; margin-bottom: 18px; }
.secure-note :deep(svg) { color: var(--teal); flex-shrink: 0; margin-top: 1px; }

.controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.country { padding: 13px 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 15px; }
.search input { width: 100%; padding: 13px 14px; border-radius: 13px; background: var(--surface-2); border: 1px solid var(--border); color: var(--text); font-size: 16px; }

.bank-list { display: flex; flex-direction: column; gap: 8px; }
.bank-item { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; color: var(--text); }
.bank-item:disabled { opacity: 0.5; }
.bank-logo-img { width: 38px; height: 38px; border-radius: 10px; object-fit: contain; background: #fff; }
.bank-logo-fallback { width: 38px; height: 38px; border-radius: 10px; background: var(--surface-3); display: grid; place-items: center; font-weight: 800; font-size: 13px; color: var(--text-dim); flex-shrink: 0; }
.bank-name { flex: 1; font-weight: 600; font-size: 15px; }
.bank-item :deep(svg) { color: var(--text-faint); }

.muted { color: var(--text-dim); font-size: 14px; padding: 8px 2px; }
.err { color: var(--red); font-size: 13px; margin: 4px 0; }
.note { color: var(--text-faint); font-size: 12px; margin-top: 16px; text-align: center; }

.account { padding: 16px 18px; margin-bottom: 12px; }
.acc-top { display: flex; justify-content: space-between; align-items: center; }
.acc-name { font-weight: 700; font-size: 16px; }
.acc-bal { font-weight: 800; font-size: 18px; color: var(--teal); }
.acc-iban { color: var(--text-dim); font-size: 13px; margin-top: 6px; letter-spacing: 0.04em; }

.sub-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.sub-mid { flex: 1; }
.sub-label { font-weight: 600; font-size: 15px; }
.sub-meta { color: var(--text-dim); font-size: 12px; margin-top: 2px; }
.sub-add { background: color-mix(in srgb, var(--teal) 16%, transparent); color: var(--teal); font-weight: 700; font-size: 13px; padding: 8px 14px; border-radius: 999px; }
.sub-done { color: var(--green); }

.tx { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.tx-left { flex: 1; }
.tx-label { font-weight: 600; font-size: 15px; }
.tx-date { color: var(--text-dim); font-size: 12px; margin-top: 2px; }
.tx-amt { font-weight: 700; font-size: 15px; }
.tx-amt.pos { color: var(--green); }

.guide-intro { color: var(--text-dim); font-size: 14px; margin-bottom: 18px; }
.steps { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.steps li { display: flex; gap: 14px; align-items: flex-start; }
.steps .num { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; background: color-mix(in srgb, var(--teal) 18%, transparent); color: var(--teal); font-weight: 800; font-size: 14px; display: grid; place-items: center; }
.steps b { font-size: 15px; }
.steps p { color: var(--text-dim); font-size: 13px; line-height: 1.5; margin-top: 3px; }
.guide-secure { display: flex; align-items: center; gap: 8px; color: var(--text-dim); font-size: 12px; margin: 20px 0 16px; }
.guide-secure :deep(svg) { color: var(--teal); flex-shrink: 0; }
.guide-btn { width: 100%; padding: 15px; border-radius: 14px; background: var(--teal); color: #04150f; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
