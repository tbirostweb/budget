// -------------------------------------------------------------------------
// Couche d'intégration bancaire (DSP2 / Open Banking)
//
// La connexion directe à Société Générale est IMPOSSIBLE sans agrégateur agréé.
// Ce module est structuré pour GoCardless Bank Account Data (ex-Nordigen),
// qui offre un accès gratuit et supporte Société Générale.
//
// ⚠️ IMPORTANT : les appels réels doivent passer par un petit backend (Node/
// Express, serverless…) car le secret API ne doit JAMAIS être exposé côté
// navigateur. Ici, `API_BASE` pointe vers ce backend que tu déploieras.
//
// Étapes GoCardless :
//   1. Créer un compte : https://bankaccountdata.gocardless.com
//   2. Récupérer secret_id / secret_key
//   3. Backend : POST /api/token -> access token
//   4. Lister les banques (institutions) du pays "FR"
//   5. Créer une "requisition" -> l'utilisateur s'authentifie chez SG
//   6. Après consentement : récupérer comptes, soldes, transactions
// -------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_BANK_API || '/api'
const USE_MOCK = !import.meta.env.VITE_BANK_API

// Institution Société Générale chez GoCardless (FR)
export const SG_INSTITUTION_ID = 'SOCIETE_GENERALE_SOGEFRPP'

async function call(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) throw new Error(`Erreur banque: ${res.status}`)
  return res.json()
}

// 0) Liste des banques disponibles pour un pays (toutes, pas seulement SG)
export async function fetchInstitutions(country = 'FR') {
  if (USE_MOCK) return mockInstitutions(country)
  return call(`/bank/institutions?country=${country}`)
}

// 1) Démarre le flux de connexion : renvoie une URL de consentement de la banque
export async function startConnection(institutionId = SG_INSTITUTION_ID) {
  if (USE_MOCK) {
    return { link: '#mock-consent', requisitionId: 'mock-req-123' }
  }
  return call('/bank/connect', {
    method: 'POST',
    body: JSON.stringify({ institutionId, redirect: window.location.origin + '/#/bank' })
  })
}

// 2) Après le retour du consentement : récupère les comptes liés
export async function fetchAccounts(requisitionId) {
  if (USE_MOCK) return mockAccounts()
  return call(`/bank/accounts?requisition=${requisitionId}`)
}

// 3) Transactions d'un compte
export async function fetchTransactions(accountId) {
  if (USE_MOCK) return mockTransactions()
  return call(`/bank/transactions?account=${accountId}`)
}

// -------------------------------------------------------------------------
// Catégorisation automatique des transactions (#18)
// Règles simples mot-clé -> catégorie. Extensible à volonté.
// -------------------------------------------------------------------------
const CATEGORY_RULES = [
  { match: ['carrefour', 'leclerc', 'auchan', 'lidl', 'monoprix', 'franprix'], category: 'Courses', icon: 'groceries' },
  { match: ['total', 'shell', 'esso', 'bp', 'station'], category: 'Transport', icon: 'fuel' },
  { match: ['sncf', 'uber', 'ratp', 'blablacar'], category: 'Transport', icon: 'car' },
  { match: ['netflix', 'spotify', 'disney', 'canal', 'deezer', 'prime'], category: 'Abonnements', icon: 'repeat' },
  { match: ['mcdo', 'burger', 'kfc', 'deliveroo', 'ubereats', 'doordash', 'restaurant'], category: 'Alimentation', icon: 'food' },
  { match: ['pharmacie', 'doctolib', 'hopital', 'mutuelle'], category: 'Santé', icon: 'health' },
  { match: ['edf', 'engie', 'veolia', 'orange', 'free', 'sfr', 'bouygues'], category: 'Énergie', icon: 'utilities' },
  { match: ['loyer', 'immobilier', 'foncia'], category: 'Logement', icon: 'home' },
  { match: ['salaire', 'paie', 'virement recu'], category: 'Revenu', icon: 'banknote' }
]

export function categorize(label) {
  const l = (label || '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.match.some((m) => l.includes(m))) {
      return { category: rule.category, icon: rule.icon }
    }
  }
  return { category: 'Autre', icon: 'tag' }
}

// -------------------------------------------------------------------------
// Détection d'abonnements récurrents (#17)
// Repère les libellés qui reviennent avec un montant similaire.
// -------------------------------------------------------------------------
export function detectSubscriptions(transactions) {
  const groups = {}
  for (const t of transactions) {
    if (t.amount >= 0) continue
    const key = (t.label || '').toLowerCase().replace(/[0-9]/g, '').trim()
    groups[key] = groups[key] || []
    groups[key].push(t)
  }
  const subs = []
  for (const [key, txs] of Object.entries(groups)) {
    // récurrent si >= 2 occurrences OU marchand connu comme abonnement
    const known = ['netflix', 'spotify', 'disney', 'canal', 'deezer', 'free', 'orange', 'sfr']
    const isKnown = known.some((k) => key.includes(k))
    if (txs.length >= 2 || isKnown) {
      const avg = txs.reduce((a, t) => a + t.amount, 0) / txs.length
      subs.push({ label: txs[0].label, amount: Math.round(avg), count: txs.length })
    }
  }
  return subs
}

// Banques de démo par pays (mode sans backend)
function mockInstitutions(country) {
  const FR = [
    { id: 'BNP_PARIBAS_BNPAFRPP', name: 'BNP Paribas', logo: '' },
    { id: 'CREDIT_AGRICOLE_AGRIFRPP', name: 'Crédit Agricole', logo: '' },
    { id: 'SOCIETE_GENERALE_SOGEFRPP', name: 'Société Générale', logo: '' },
    { id: 'BANQUE_POPULAIRE_CCBPFRPP', name: 'Banque Populaire', logo: '' },
    { id: 'CAISSE_DEPARGNE_CEPAFRPP', name: 'Caisse d\'Épargne', logo: '' },
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

// --- Données de démo (mode sans backend) --------------------------------
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
