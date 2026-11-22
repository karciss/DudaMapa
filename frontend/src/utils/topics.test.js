import { describe, expect, it } from 'vitest'
import { compactNumber, filterTopics, formatRelativeDate, heatLevel } from './topics'

const topics = [
  { id: 1, title: 'Integrales por sustitución', subject: 'Cálculo II', summary: 'Elegir el método', supporters: 24, resolved: false },
  { id: 2, title: 'JOIN o subconsulta', subject: 'Bases de datos', summary: 'Consultas SQL', supporters: 12, resolved: true },
  { id: 3, title: 'Procesos e hilos', subject: 'Sistemas operativos', summary: 'Concurrencia', supporters: 4, resolved: false },
]

describe('utilidades del mapa de dudas', () => {
  it('clasifica una duda como punto crítico desde veinte apoyos', () => {
    expect(heatLevel(20).key).toBe('alta')
    expect(heatLevel(24).label).toBe('Punto crítico')
  })

  it('clasifica los apoyos intermedios como tema en observación', () => {
    expect(heatLevel(8).key).toBe('media')
    expect(heatLevel(19).label).toBe('En observación')
  })

  it('considera bajos los apoyos iniciales', () => {
    expect(heatLevel(0).key).toBe('baja')
    expect(heatLevel(7).color).toBe('mint')
  })

  it('busca texto sin distinguir mayúsculas ni espacios externos', () => {
    expect(filterTopics(topics, { query: '  JOIN ' })).toHaveLength(1)
    expect(filterTopics(topics, { query: 'sql' })[0].id).toBe(2)
  })

  it('combina materia y estado sin perder los criterios', () => {
    expect(filterTopics(topics, { course: 'Bases de datos', status: 'Resueltos' }).map(({ id }) => id)).toEqual([2])
    expect(filterTopics(topics, { course: 'Cálculo II', status: 'Sin resolver' })).toHaveLength(1)
  })

  it('formatea cantidades extensas con notación compacta', () => {
    expect(compactNumber(1200)).toMatch(/1,2\s*mil|1\.2\s*k/i)
    expect(compactNumber(24)).toBe('24')
  })

  it('muestra fechas recientes en lenguaje cercano', () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe('hoy')
    expect(formatRelativeDate('fecha inválida')).toBe('hace poco')
    expect(formatRelativeDate(null)).toBe('hace poco')
  })
})
