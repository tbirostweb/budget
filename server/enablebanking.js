// ---------------------------------------------------------------------------
// Connecteur Enable Banking (Open Banking / DSP2)
// Docs : https://enablebanking.com/docs/api/reference/
//
// Auth : un JWT RS256 signé avec TA clé privée sert directement de Bearer token
//   header  : { typ:'JWT', alg:'RS256', kid: APP_ID }
//   payload : { iss:'enablebanking.com', aud:'api.enablebanking.com', iat, exp }
//
// Variables d'environnement (à mettre dans Dokploy) :
//   ENABLE_APP_ID       -> l'Application ID (kid)
//   ENABLE_PRIVATE_KEY  -> la clé privée PEM (ou sa version base64, plus pratique
//                          pour une variable d'env sur une seule ligne)
//   ENABLE_REDIRECT_URL -> l'URL de retour déclarée dans le Control Panel
//                          (ex: https://budget.theo-birost.fr/)
// ---------------------------------------------------------------------------
import crypto from 'node:crypto'

const API = 'https://api.enablebanking.com'
const APP_ID = process.env.ENABLE_APP_ID
const REDIRECT_URL = process.env.ENABLE_REDIRECT_URL

export const enableConfigured = Boolean(APP_ID && process.env.ENABLE_PRIVATE_KEY)

// La clé privée peut être fournie en PEM brut ou en base64 (pratique pour Dokploy)
function privateKey() {
  const raw = process.env.ENABLE_PRIVATE_KEY || ''
  if (raw.includes('BEGIN')) return raw.replace(/\\n/g, '\n')
  return Buffer.from(raw, 'base64').toString('utf8')
}

const b64url = (input) => Buffer.from(input).toString('base64url')

function jwt() {
  const header = { typ: 'JWT', alg: 'RS256', kid: APP_ID }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: 'enablebanking.com', aud: 'api.enablebanking.com', iat: now - 10, exp: now + 3600 }
  const data = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const sig = crypto.sign('RSA-SHA256', Buffer.from(data), privateKey())
  return `${data}.${b64url(sig)}`
}

async function call(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || `Enable Banking ${res.status}`)
  return json
}

// Liste des banques (ASPSPs) d'un pays
export async function listAspsps(country = 'FR') {
  const j = await call(`/aspsps?country=${country}`)
  return (j.aspsps || []).map((a) => ({ id: a.name, name: a.name, logo: a.logo || '' }))
}

// Démarre l'autorisation -> renvoie l'URL de consentement de la banque
export async function startAuth(aspspName, country, state) {
  const valid = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().replace(/\.\d+Z$/, 'Z')
  const j = await call('/auth', {
    method: 'POST',
    body: JSON.stringify({
      access: { valid_until: valid },
      aspsp: { name: aspspName, country },
      state,
      redirect_url: REDIRECT_URL,
      psu_type: 'personal'
    })
  })
  return { link: j.url, requisitionId: j.authorization_id || state }
}

// Après le retour de la banque (code dans l'URL) -> crée la session + liste les comptes
export async function createSession(code) {
  const j = await call('/sessions', { method: 'POST', body: JSON.stringify({ code }) })
  const out = []
  for (const acc of j.accounts || []) {
    const id = acc.uid || acc
    let balance = 0, currency = 'EUR', iban = acc.account_id?.iban || ''
    try {
      const b = await call(`/accounts/${id}/balances`)
      const first = b.balances?.[0]?.balance_amount
      balance = Number(first?.amount || 0)
      currency = first?.currency || 'EUR'
    } catch { /* ignore */ }
    out.push({
      id,
      name: acc.name || acc.product || 'Compte',
      iban,
      balance,
      currency
    })
  }
  return { sessionId: j.session_id, accounts: out }
}

// Transactions d'un compte
export async function listTransactions(accountId) {
  const j = await call(`/accounts/${accountId}/transactions`)
  return (j.transactions || []).map((t) => ({
    id: t.entry_reference || t.transaction_id || crypto.randomUUID(),
    date: t.booking_date || t.value_date,
    label: t.remittance_information?.join(' ') || t.creditor?.name || t.debtor?.name || 'Transaction',
    amount: (t.credit_debit_indicator === 'DBIT' ? -1 : 1) * Number(t.transaction_amount?.amount || 0)
  }))
}
