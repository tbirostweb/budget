// Authentification passwordless : code à 6 chiffres par email -> cookie de session.
import crypto from 'node:crypto'
import express from 'express'
import db from './db.js'
import { sendLoginCode } from './mailer.js'

const router = express.Router()

const CODE_TTL = 10 * 60 * 1000        // 10 min
const SESSION_TTL = 60 * 24 * 3600 * 1000 // 60 jours
const PROD = process.env.NODE_ENV === 'production'

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const normalize = (e) => String(e || '').trim().toLowerCase()
const validEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)

// Rate limiting en mémoire : max N demandes de code par email sur une fenêtre
const codeHits = new Map()
function tooManyRequests(email, max = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now()
  const arr = (codeHits.get(email) || []).filter((t) => now - t < windowMs)
  arr.push(now)
  codeHits.set(email, arr)
  return arr.length > max
}

function setSessionCookie(res, token) {
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD,
    maxAge: SESSION_TTL,
    path: '/'
  })
}

// 1) Demander un code
router.post('/request-code', async (req, res) => {
  const email = normalize(req.body.email)
  if (!validEmail(email)) return res.status(400).json({ error: 'Email invalide' })
  if (tooManyRequests(email)) return res.status(429).json({ error: 'Trop de demandes, réessaie plus tard' })

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  db.prepare(`
    INSERT INTO login_codes (email, code_hash, expires_at, attempts)
    VALUES (?, ?, ?, 0)
    ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0
  `).run(email, sha(code), Date.now() + CODE_TTL)

  try {
    await sendLoginCode(email, code)
  } catch (e) {
    return res.status(500).json({ error: "Échec de l'envoi de l'email" })
  }
  res.json({ ok: true })
})

// 2) Vérifier le code -> crée l'utilisateur si besoin + session
router.post('/verify', (req, res) => {
  const email = normalize(req.body.email)
  const code = String(req.body.code || '').trim()
  const row = db.prepare('SELECT * FROM login_codes WHERE email = ?').get(email)

  if (!row) return res.status(400).json({ error: 'Demande un nouveau code' })
  if (Date.now() > row.expires_at) return res.status(400).json({ error: 'Code expiré' })
  if (row.attempts >= 5) return res.status(429).json({ error: 'Trop de tentatives' })

  if (sha(code) !== row.code_hash) {
    db.prepare('UPDATE login_codes SET attempts = attempts + 1 WHERE email = ?').run(email)
    return res.status(400).json({ error: 'Code incorrect' })
  }

  db.prepare('DELETE FROM login_codes WHERE email = ?').run(email)

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    const info = db.prepare('INSERT INTO users (email, created_at) VALUES (?, ?)').run(email, Date.now())
    user = { id: info.lastInsertRowid, email }
  }

  const token = crypto.randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .run(token, user.id, Date.now() + SESSION_TTL)

  setSessionCookie(res, token)
  res.json({ user: { id: user.id, email: user.email } })
})

// 3) Déconnexion
router.post('/logout', (req, res) => {
  const token = req.cookies?.session
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  res.clearCookie('session', { path: '/' })
  res.json({ ok: true })
})

// 4) Utilisateur courant
router.get('/me', (req, res) => {
  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Non connecté' })
  res.json({ user: { id: user.id, email: user.email } })
})

// Récupère l'utilisateur à partir du cookie de session
export function getUser(req) {
  const token = req.cookies?.session
  if (!token) return null
  const s = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token)
  if (!s || Date.now() > s.expires_at) {
    if (s) db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return null
  }
  return db.prepare('SELECT id, email FROM users WHERE id = ?').get(s.user_id)
}

// Middleware de protection
export function requireAuth(req, res, next) {
  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Non connecté' })
  req.user = user
  next()
}

export default router
