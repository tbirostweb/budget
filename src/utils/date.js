// Helpers de dates pour le moteur de récurrences et le calendrier

export function iso(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function today() {
  return new Date('2026-08-10T12:00:00') // date de référence de la démo
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function addMonths(date, n) {
  const d = new Date(date)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  // garder le jour, borné au dernier jour du mois
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  return d
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function diffDays(a, b) {
  const ms = new Date(iso(b)) - new Date(iso(a))
  return Math.round(ms / 86400000)
}

// Génère la grille du calendrier (semaines de lundi à dimanche) pour un mois donné
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  // JS: 0=dim..6=sam -> on veut lundi=0
  let startOffset = (first.getDay() + 6) % 7
  const total = daysInMonth(year, month)
  const cells = []
  // jours du mois précédent pour compléter la 1re semaine
  for (let i = startOffset; i > 0; i--) {
    cells.push({ date: new Date(year, month, 1 - i), outside: true })
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ date: new Date(year, month, d), outside: false })
  }
  // compléter la dernière semaine
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), outside: true })
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}
