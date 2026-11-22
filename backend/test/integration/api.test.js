import test, { afterEach } from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { createDatabase } from '../../src/database.js'

const contexts = new Set()
function setup() {
  const db = createDatabase(':memory:')
  const app = createApp({ db })
  const context = { app, db }
  contexts.add(context)
  return context
}
afterEach(() => {
  for (const context of contexts) context.db.close()
  contexts.clear()
})

test('GET /api/health confirma que la API responde', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/health').expect(200)
  assert.deepEqual(response.body, { status: 'ok', service: 'dudamapa-api' })
})

test('GET /api/courses devuelve el plan de estudios con sexto semestre primero', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/courses').expect(200)
  assert.ok(response.body.includes('Software Quality Assurance · SQA1T6'))
  assert.equal(response.body[0], 'Proyecto de Sistemas III · PRS3T6')
  assert.ok(response.body.includes('Programación I · PRG1T1'))
  assert.equal(new Set(response.body).size, response.body.length)
})

test('GET /api/topics lista el mapa con preguntas y estado tipado', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/topics').expect(200)
  assert.ok(response.body.length >= 8)
  assert.equal(typeof response.body[0].resolved, 'boolean')
  assert.ok(response.body[0].supporters >= response.body.at(-1).supporters)
})

test('GET /api/topics aplica búsqueda por texto y materia', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/topics').query({ q: 'E2E', course: 'Software Quality Assurance · SQA1T6' }).expect(200)
  assert.equal(response.body.length, 1)
  assert.equal(response.body[0].subject, 'Software Quality Assurance · SQA1T6')
})

test('GET /api/topics filtra las dudas resueltas', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/topics?status=resolved').expect(200)
  assert.ok(response.body.length >= 1)
  assert.ok(response.body.every((topic) => topic.resolved))
})

test('GET /api/topics/:id incluye las preguntas anónimas asociadas', async () => {
  const { app } = setup()
  const listing = await request(app).get('/api/topics').expect(200)
  const response = await request(app).get(`/api/topics/${listing.body[0].id}`).expect(200)
  assert.ok(response.body.questions.length >= 1)
  assert.equal(response.body.id, listing.body[0].id)
})

test('POST /api/questions crea tema, pregunta y devuelve el grupo actualizado', async () => {
  const { app } = setup()
  const response = await request(app).post('/api/questions').send({
    title: '¿Cómo preparar una consulta eficiente?',
    subject: 'Proyecto de Sistemas III · PRS3T6',
    body: 'Me cuesta decidir qué índice elegir al consultar varias tablas.',
  }).expect(201)
  assert.equal(response.body.topic.resolved, false)
  assert.equal(response.body.topic.questionsCount, 1)
  assert.equal(response.body.question.author, null)
})

test('POST /api/questions valida los campos obligatorios', async () => {
  const { app } = setup()
  const response = await request(app).post('/api/questions').send({ title: 'x' }).expect(400)
  assert.match(response.body.error, /título/i)
})

test('POST /api/topics/:id/endorse incrementa el apoyo del tema', async () => {
  const { app } = setup()
  const before = (await request(app).get('/api/topics').expect(200)).body[0]
  const response = await request(app).post(`/api/topics/${before.id}/endorse`).send({}).expect(200)
  assert.equal(response.body.supporters, before.supporters + 1)
})

test('POST /api/topics/:id/resolve publica explicación y actualiza su estado', async () => {
  const { app } = setup()
  const topic = (await request(app).get('/api/topics').expect(200)).body.find((item) => !item.resolved)
  const explanation = 'Primero identifica las condiciones del problema y compara un ejemplo pequeño.'
  const response = await request(app).post(`/api/topics/${topic.id}/resolve`).send({ explanation }).expect(200)
  assert.equal(response.body.resolved, true)
  assert.equal(response.body.explanation, explanation)
})

test('POST /api/topics/:id/resolve rechaza una explicación vacía', async () => {
  const { app } = setup()
  const topic = (await request(app).get('/api/topics').expect(200)).body[0]
  const response = await request(app).post(`/api/topics/${topic.id}/resolve`).send({ explanation: 'No sé.' }).expect(400)
  assert.match(response.body.error, /explicación/i)
})

test('rutas de temas inexistentes responden 404', async () => {
  const { app } = setup()
  const response = await request(app).get('/api/topics/99999').expect(404)
  assert.match(response.body.error, /encontramos/i)
})
