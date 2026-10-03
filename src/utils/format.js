// Formatage monétaire et de dates en français (euros)

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

const eurCents = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

// 1 234 € (arrondi) — usage courant dans l'app
export function money(n) {
  return eur.format(Math.round(n))
}

// 1 234,56 € (précis) — soldes, transactions bancaires
export function moneyPrecise(n) {
  return eurCents.format(n)
}

// Montant signé : +1 234 € / -1 234 €
export function signed(n) {
  const s = money(Math.abs(n))
  return (n >= 0 ? '+' : '-') + s
}

// 12,3 k€ pour les grands nombres
export function compact(n) {
  const abs = Math.abs(n)
  if (abs >= 1000) {
    const v = (n / 1000).toFixed(abs >= 10000 ? 0 : 1).replace('.', ',')
    return v + ' k€'
  }
  return money(n)
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHS_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin',
  'juil', 'août', 'sep', 'oct', 'nov', 'déc']
const DOWS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function monthName(m) { return MONTHS[m] }
export function monthShort(m) { return MONTHS_SHORT[m] }
export const weekdays = DOWS

// "8 août" à partir d'une date ISO ou d'un objet Date
export function dayLabel(d) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`
}

export function fullDate(d) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}
