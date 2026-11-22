export function normalizeTitle(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

export function validateQuestionInput(input = {}) {
  const errors = []
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const subject = typeof input.subject === 'string' ? input.subject.trim() : ''
  const body = typeof input.body === 'string' ? input.body.trim() : ''
  if (title.length < 8 || title.length > 120) errors.push('El título debe tener entre 8 y 120 caracteres.')
  if (subject.length < 2 || subject.length > 80) errors.push('Selecciona una materia válida.')
  if (body.length < 12 || body.length > 800) errors.push('La descripción debe tener entre 12 y 800 caracteres.')
  if (input.author != null && (typeof input.author !== 'string' || input.author.trim().length > 50)) errors.push('El nombre opcional no puede superar 50 caracteres.')
  return { valid: errors.length === 0, errors, value: { title, subject, body, author: typeof input.author === 'string' ? input.author.trim() || null : null } }
}

export function validateExplanation(value) {
  const explanation = typeof value === 'string' ? value.trim() : ''
  if (explanation.length < 20 || explanation.length > 1200) {
    return { valid: false, error: 'La explicación debe tener entre 20 y 1200 caracteres.' }
  }
  return { valid: true, value: explanation }
}

export function heatLevelFor(supporters = 0) {
  if (supporters >= 20) return 'Punto crítico'
  if (supporters >= 8) return 'En observación'
  return 'Baja'
}

export function makeSummary(body = '') {
  const summary = body.trim().replace(/\s+/g, ' ')
  return summary.length > 150 ? `${summary.slice(0, 147).trimEnd()}…` : summary
}

export function parseTags(value = '[]') {
  try {
    const tags = JSON.parse(value)
    return Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string') : []
  } catch {
    return []
  }
}

export function normalizeStatus(status) {
  if (!status || status === 'Todos') return null
  if (status === 'resolved' || status === 'Resueltos') return true
  if (status === 'open' || status === 'Sin resolver') return false
  return undefined
}
