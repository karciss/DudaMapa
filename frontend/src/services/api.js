const API_ROOT = '/api'

async function request(path, options) {
  const response = await fetch(`${API_ROOT}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.error ?? 'No se pudo completar la solicitud.')
  return payload
}

export function getCourses() {
  return request('/courses')
}

export function getTopics(filters = {}) {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.course && filters.course !== 'Todas las materias') params.set('course', filters.course)
  if (filters.status && filters.status !== 'Todos') params.set('status', filters.status === 'Resueltos' ? 'resolved' : 'open')
  return request(`/topics${params.size ? `?${params}` : ''}`)
}

export function getTopic(id) {
  return request(`/topics/${encodeURIComponent(id)}`)
}

export function postQuestion(body) {
  return request('/questions', { method: 'POST', body: JSON.stringify(body) })
}

export function endorseTopic(id) {
  return request(`/topics/${encodeURIComponent(id)}/endorse`, { method: 'POST', body: '{}' })
}

export function resolveTopic(id, explanation) {
  return request(`/topics/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ explanation }),
  })
}
