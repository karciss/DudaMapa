export const HEAT_LEVELS = [
  { key: 'baja', label: 'Baja', min: 0, max: 7, color: 'mint' },
  { key: 'media', label: 'En observación', min: 8, max: 19, color: 'sun' },
  { key: 'alta', label: 'Punto crítico', min: 20, max: Infinity, color: 'coral' },
]

export function heatLevel(count = 0) {
  const level = HEAT_LEVELS.find(({ min, max }) => count >= min && count <= max)
  return level ?? HEAT_LEVELS[0]
}

export function filterTopics(topics, { query = '', course = 'Todas las materias', status = 'Todos' } = {}) {
  const normalized = query.trim().toLocaleLowerCase('es')
  return topics.filter((topic) => {
    const matchesQuery = !normalized || `${topic.title} ${topic.subject} ${topic.summary ?? ''}`.toLocaleLowerCase('es').includes(normalized)
    const matchesCourse = course === 'Todas las materias' || topic.subject === course
    const matchesStatus = status === 'Todos' || (status === 'Resueltos' ? topic.resolved : !topic.resolved)
    return matchesQuery && matchesCourse && matchesStatus
  })
}

export function compactNumber(value = 0) {
  return new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatRelativeDate(value) {
  if (!value) return 'hace poco'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'hace poco'
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days < 1) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
