import express from 'express'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDatabase, createQuestion, getTopicById, listTopics, mapTopic } from './database.js'
import { COURSES } from './courses.js'
import { normalizeStatus, normalizeTitle, validateExplanation, validateQuestionInput } from './utils.js'

export function createApp({ db = createDatabase() } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '32kb' }))

  app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'dudamapa-api' }))

  app.get('/api/courses', (_request, response) => {
    response.json(COURSES)
  })

  app.get('/api/topics', (request, response) => {
    const status = normalizeStatus(request.query.status)
    if (status === undefined) return response.status(400).json({ error: 'El filtro de estado no es válido.' })
    const q = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 100) : ''
    const course = typeof request.query.course === 'string' ? request.query.course.trim().slice(0, 80) : ''
    response.json(listTopics(db, { q, course: course || null, status }))
  })

  app.get('/api/topics/:id', (request, response) => {
    const topic = getTopicById(db, Number(request.params.id))
    if (!topic) return response.status(404).json({ error: 'No encontramos esa duda.' })
    response.json(topic)
  })

  app.post('/api/questions', (request, response) => {
    const validation = validateQuestionInput(request.body)
    if (!validation.valid) return response.status(400).json({ error: validation.errors[0], details: validation.errors })
    const { title, subject } = validation.value
    const topic = createQuestion(db, validation.value, `${subject.toLocaleLowerCase('es')}::${normalizeTitle(title)}`)
    response.status(201).json({ topic, question: topic.questions[0] })
  })

  app.post('/api/topics/:id/endorse', (request, response) => {
    const id = Number(request.params.id)
    const result = db.prepare('UPDATE topics SET supporters = supporters + 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id)
    if (result.changes === 0) return response.status(404).json({ error: 'No encontramos esa duda.' })
    response.json(mapTopic(db.prepare('SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.topic_id=t.id) AS questions_count FROM topics t WHERE t.id = ?').get(id)))
  })

  app.post('/api/topics/:id/resolve', (request, response) => {
    const id = Number(request.params.id)
    if (!getTopicById(db, id)) return response.status(404).json({ error: 'No encontramos esa duda.' })
    const validation = validateExplanation(request.body?.explanation)
    if (!validation.valid) return response.status(400).json({ error: validation.error })
    db.prepare('UPDATE topics SET resolved = 1, explanation = ?, updated_at = ? WHERE id = ?').run(validation.value, new Date().toISOString(), id)
    response.json(mapTopic(db.prepare('SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.topic_id=t.id) AS questions_count FROM topics t WHERE t.id = ?').get(id)))
  })

  const frontendDist = resolve(fileURLToPath(new URL('../../frontend/dist', import.meta.url)))
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist, { maxAge: '1h', index: false }))
    app.get(/^(?!\/api(?:\/|$)).*/, (_request, response) => response.sendFile(resolve(frontendDist, 'index.html')))
  }

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) return response.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' })
    console.error('Error inesperado en la API:', error)
    response.status(500).json({ error: 'Ocurrió un error inesperado.' })
  })

  app.locals.database = db
  return app
}
