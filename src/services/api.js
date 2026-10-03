// Appels vers le backend (auth + synchronisation des données).
// `credentials: 'include'` pour transmettre le cookie de session.

async function call(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erreur ${res.status}`)
  return json
}

export const api = {
  requestCode: (email) => call('/auth/request-code', { method: 'POST', body: JSON.stringify({ email }) }),
  verify: (email, code) => call('/auth/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  logout: () => call('/auth/logout', { method: 'POST' }),
  me: () => call('/auth/me'),
  getData: () => call('/data'),
  saveData: (data) => call('/data', { method: 'PUT', body: JSON.stringify({ data }) })
}
