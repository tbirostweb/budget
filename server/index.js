// ---------------------------------------------------------------------------
// Serveur unifié : sert le front Vue compilé (dist/) + l'API bancaire.
//
// Mode RÉEL   : si SECRET_ID et SECRET_KEY (GoCardless) sont définis.
// Mode DÉMO   : sinon, l'API renvoie des données fictives -> l'app marche
//               quand même. Ajoute simplement les variables dans Dokploy
//               pour passer en réel, sans changer le code.
// ---------------------------------------------------------------------------
import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import db from './db.js'
import authRouter, { requireAuth } from './auth.js'
import * as eb from './enablebanking.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, '..', 'dist')

const PORT = process.env.PORT || 3000
const SECRET_ID = process.env.GOCARDLESS_SECRET_ID
const SECRET_KEY = process.env.GOCARDLESS_SECRET_KEY
const REAL = Boolean(SECRET_ID && SECRET_KEY)
const ENABLE = eb.enableConfigured
const GC_BASE = 'https://bankaccountdata.gocardless.com/api/v2'
// Priorité : Enable Banking > GoCardless > démo
const BANK_MODE = ENABLE ? 'enable' : REAL ? 'gocardless' : 'demo'

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())

// ---- Authentification (code par email) ----
app.use('/api/auth', authRouter)

// ---- Données de l'utilisateur (sync multi-appareils) ----
app.get('/api/data', requireAuth, (req, res) => {
  const row = db.prepare('SELECT data, updated_at FROM app_data WHERE user_id = ?').get(req.user.id)
  if (!row) return res.json({ data: null })
  res.json({ data: JSON.parse(row.data), updatedAt: row.updated_at })
})

app.put('/api/data', requireAuth, (req, res) => {
  const data = JSON.stringify(req.body?.data ?? {})
  db.prepare(`
    INSERT INTO app_data (user_id, data, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(req.user.id, data, Date.now())
  res.json({ ok: true })
})

// ---- État en mémoire (suffisant pour un usage perso) ----
let token = null
let tokenExp = 0
const requisitions = {} // requisitionId -> { accounts: [] }

async function getToken() {
  if (token && Date.now() < tokenExp) return token
  const r = await fetch(`${GC_BASE}/token/new/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret_id: SECRET_ID, secret_key: SECRET_KEY })
  })
  if (!r.ok) throw new Error('Auth GoCardless échouée')
  const j = await r.json()
  token = j.access
  tokenExp = Date.now() + (j.access_expires - 60) * 1000
  return token
}
const auth = async () => ({ Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' })

// ---- API : liste des banques d'un pays ----
app.get('/api/bank/institutions', requireAuth, async (req, res) => {
  const country = String(req.query.country || 'FR').toUpperCase().slice(0, 2)
  try {
    if (BANK_MODE === 'enable') return res.json(await eb.listAspsps(country))
    if (BANK_MODE === 'demo') return res.json(mockInstitutions(country))
    const h = await auth()
    const r = await fetch(`${GC_BASE}/institutions/?country=${country}`, { headers: h })
    const list = await r.json()
    res.json((Array.isArray(list) ? list : []).map((i) => ({ id: i.id, name: i.name, logo: i.logo })))
  } catch (e) {
    console.error('[bank/institutions]', e)
    res.status(500).json({ error: 'Erreur bancaire' })
  }
})

// ---- API : démarrer la connexion ----
app.post('/api/bank/connect', requireAuth, async (req, res) => {
  try {
    if (BANK_MODE === 'enable') {
      const country = String(req.body.country || 'FR').toUpperCase().slice(0, 2)
      const state = 'u' + req.user?.id + '-' + Date.now()
      return res.json(await eb.startAuth(req.body.institutionId, country, state))
    }
    if (BANK_MODE === 'demo') {
      return res.json({ link: 'demo', requisitionId: 'demo' })
    }
    const h = await auth()
    const { institutionId, redirect } = req.body
    const r = await fetch(`${GC_BASE}/requisitions/`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        redirect,
        institution_id: institutionId || 'SOCIETE_GENERALE_SOGEFRPP',
        reference: 'user-' + Date.now()
      })
    })
    const j = await r.json()
    res.json({ link: j.link, requisitionId: j.id })
  } catch (e) {
    console.error('[bank/connect]', e)
    res.status(500).json({ error: 'Erreur bancaire' })
  }
})

// ---- API : session Enable Banking (après retour de la banque avec le code) ----
app.get('/api/bank/session', requireAuth, async (req, res) => {
  try {
    if (BANK_MODE === 'enable') {
      const { accounts } = await eb.createSession(req.query.code)
      return res.json(accounts)
    }
    // démo / GoCardless : pas de code -> renvoie les comptes de démo
    res.json(mockAccounts())
  } catch (e) {
    console.error('[bank/session]', e)
    res.status(500).json({ error: 'Erreur bancaire' })
  }
})

// ---- API : comptes ----
app.get('/api/bank/accounts', requireAuth, async (req, res) => {
  try {
    if (BANK_MODE !== 'gocardless') return res.json(mockAccounts())
    const h = await auth()
    const r = await fetch(`${GC_BASE}/requisitions/${req.query.requisition}/`, { headers: h })
    const { accounts } = await r.json()
    requisitions[req.query.requisition] = { accounts }
    const out = []
    for (const id of accounts) {
      const [bal, det] = await Promise.all([
        fetch(`${GC_BASE}/accounts/${id}/balances/`, { headers: h }).then((r) => r.json()),
        fetch(`${GC_BASE}/accounts/${id}/details/`, { headers: h }).then((r) => r.json())
      ])
      out.push({
        id,
        name: det.account.name || det.account.product || 'Compte',
        iban: det.account.iban,
        balance: Number(bal.balances?.[0]?.balanceAmount?.amount || 0),
        currency: bal.balances?.[0]?.balanceAmount?.currency || 'EUR'
      })
    }
    res.json(out)
  } catch (e) {
    console.error('[bank/accounts]', e)
    res.status(500).json({ error: 'Erreur bancaire' })
  }
})

// ---- API : transactions ----
app.get('/api/bank/transactions', requireAuth, async (req, res) => {
  try {
    if (BANK_MODE === 'enable') return res.json(await eb.listTransactions(req.query.account))
    if (BANK_MODE === 'demo') return res.json(mockTransactions())
    const h = await auth()
    const r = await fetch(`${GC_BASE}/accounts/${req.query.account}/transactions/`, { headers: h })
    const j = await r.json()
    res.json((j.transactions?.booked || []).map((t) => ({
      id: t.transactionId,
      date: t.bookingDate,
      label: t.remittanceInformationUnstructured || t.creditorName || t.debtorName || 'Transaction',
      amount: Number(t.transactionAmount.amount)
    })))
  } catch (e) {
    console.error('[bank/transactions]', e)
    res.status(500).json({ error: 'Erreur bancaire' })
  }
})

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: REAL ? 'real' : 'demo' }))

// ---- Front : fichiers statiques + fallback SPA ----
app.use(express.static(DIST))
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))

app.listen(PORT, () => {
  console.log(`Serveur prêt sur le port ${PORT} — mode banque : ${REAL ? 'RÉEL (GoCardless)' : 'DÉMO'}`)
})

// ---- Données de démo ----
function mockInstitutions(country) {
  const FR = [
    { id: 'BNP_PARIBAS_BNPAFRPP', name: 'BNP Paribas', logo: '' },
    { id: 'CREDIT_AGRICOLE_AGRIFRPP', name: 'Crédit Agricole', logo: '' },
    { id: 'SOCIETE_GENERALE_SOGEFRPP', name: 'Société Générale', logo: '' },
    { id: 'BANQUE_POPULAIRE_CCBPFRPP', name: 'Banque Populaire', logo: '' },
    { id: 'CAISSE_DEPARGNE_CEPAFRPP', name: "Caisse d'Épargne", logo: '' },
    { id: 'CREDIT_MUTUEL_CMCIFRPP', name: 'Crédit Mutuel', logo: '' },
    { id: 'LCL_CRLYFRPP', name: 'LCL', logo: '' },
    { id: 'LA_BANQUE_POSTALE_PSSTFRPP', name: 'La Banque Postale', logo: '' },
    { id: 'BOURSORAMA_BOUSFRPP', name: 'BoursoBank (Boursorama)', logo: '' },
    { id: 'HELLO_BANK_BNPAFRPP', name: 'Hello bank!', logo: '' },
    { id: 'FORTUNEO_FTNOFRP1', name: 'Fortuneo', logo: '' },
    { id: 'REVOLUT_REVOLT21', name: 'Revolut', logo: '' },
    { id: 'N26_NTSBDEB1', name: 'N26', logo: '' }
  ]
  const BE = [
    { id: 'KBC_KREDBEBB', name: 'KBC', logo: '' },
    { id: 'BELFIUS_GKCCBEBB', name: 'Belfius', logo: '' },
    { id: 'ING_BBRUBEBB', name: 'ING', logo: '' }
  ]
  return country === 'BE' ? BE : FR
}
function mockAccounts() {
  return [
    { id: 'acc_1', name: 'Compte courant SG', iban: 'FR76 3000 3•••• •••• 4821', balance: 1475.32, currency: 'EUR' },
    { id: 'acc_2', name: 'Livret A', iban: 'FR76 3000 3•••• •••• 9930', balance: 8200.0, currency: 'EUR' }
  ]
}
function mockTransactions() {
  return [
    { id: 't1', date: '2026-08-09', label: 'CARREFOUR MARKET', amount: -54 },
    { id: 't2', date: '2026-08-08', label: 'NETFLIX.COM', amount: -20 },
    { id: 't3', date: '2026-08-07', label: 'VIREMENT SALAIRE', amount: 2400 },
    { id: 't4', date: '2026-08-06', label: 'TOTAL ENERGIES', amount: -80 },
    { id: 't5', date: '2026-08-05', label: 'SPOTIFY P1234', amount: -10 },
    { id: 't6', date: '2026-08-03', label: 'DELIVEROO', amount: -28 },
    { id: 't7', date: '2026-07-08', label: 'NETFLIX.COM', amount: -20 },
    { id: 't8', date: '2026-07-05', label: 'SPOTIFY P0987', amount: -10 },
    { id: 't9', date: '2026-08-02', label: 'PHARMACIE DU CENTRE', amount: -22 }
  ]
}
