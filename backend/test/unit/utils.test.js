import test from 'node:test'
import assert from 'node:assert/strict'
import { heatLevelFor, makeSummary, normalizeStatus, normalizeTitle, parseTags, validateExplanation, validateQuestionInput } from '../../src/utils.js'

test('normaliza título con acentos, espacios y mayúsculas para agrupar dudas', () => {
  assert.equal(normalizeTitle('  ¿Cómo   resolver INTEGRALES? '), '¿como resolver integrales?')
})

test('acepta una duda completa y conserva publicación anónima', () => {
  const result = validateQuestionInput({ title: '¿Cómo funciona una API?', subject: 'Arquitectura', body: 'Me cuesta entender los recursos y verbos HTTP.', author: '' })
  assert.equal(result.valid, true)
  assert.equal(result.value.author, null)
})

test('rechaza una duda con campos demasiado cortos', () => {
  const result = validateQuestionInput({ title: 'API', subject: 'A', body: 'No sé.' })
  assert.equal(result.valid, false)
  assert.equal(result.errors.length, 3)
})

test('valida que una explicación aporte contenido suficiente', () => {
  assert.equal(validateExplanation('Respuesta corta').valid, false)
  assert.equal(validateExplanation('Primero identifica los recursos y después revisa el método HTTP.').valid, true)
})

test('asigna una intensidad legible según el número de apoyos', () => {
  assert.equal(heatLevelFor(3), 'Baja')
  assert.equal(heatLevelFor(8), 'En observación')
  assert.equal(heatLevelFor(20), 'Punto crítico')
})

test('recorta resúmenes largos sin alterar los cortos', () => {
  assert.equal(makeSummary('  Idea breve  '), 'Idea breve')
  assert.equal(makeSummary('x'.repeat(170)).length, 148)
})

test('parsea etiquetas y tolera contenido de base de datos dañado', () => {
  assert.deepEqual(parseTags('["SQL", 4, "joins"]'), ['SQL', 'joins'])
  assert.deepEqual(parseTags('no-json'), [])
})

test('normaliza los estados del filtro sin aceptar valores arbitrarios', () => {
  assert.equal(normalizeStatus('resolved'), true)
  assert.equal(normalizeStatus('open'), false)
  assert.equal(normalizeStatus('Todos'), null)
  assert.equal(normalizeStatus('unknown'), undefined)
})
