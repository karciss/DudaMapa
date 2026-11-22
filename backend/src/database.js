import Database from 'better-sqlite3'
import { makeSummary, normalizeTitle } from './utils.js'

const SEED_TOPICS = [
  { title: '¿Cómo distinguir pruebas de integración y E2E?', subject: 'Software Quality Assurance · SQA1T6', supporters: 26, tags: ['testing', 'calidad'], body: 'En el proyecto de sistemas me cuesta decidir qué validar entre componentes y qué comprobar desde la experiencia completa de una persona usuaria.' },
  { title: '¿Cómo reducir el mareo en Realidad Virtual y Aumentada?', subject: 'Realidad Virtual y Aumentada · RVA1T6', supporters: 19, tags: ['realidad virtual', 'UX'], body: '¿Qué decisiones de movimiento, cámara y duración ayudan a que la experiencia inmersiva sea más cómoda?' },
  { title: '¿Qué tan grande debe ser el MVP del Proyecto de Sistemas III?', subject: 'Proyecto de Sistemas III · PRS3T6', supporters: 17, tags: ['MVP', 'alcance'], body: 'Queremos mostrar el flujo completo del proyecto sin intentar construir todas las funciones posibles. ¿Cómo delimitamos el primer entregable?' },
  { title: '¿Cómo interpretar un timeout entre dos redes?', subject: 'Redes y Comunicación de Datos II · RED2T6', supporters: 14, tags: ['redes', 'diagnóstico'], body: 'Cuando un servicio no responde, no sé cómo distinguir un problema de ruta, firewall, DNS o disponibilidad del servidor.' },
  { title: '¿Cómo convertir requisitos en entregables verificables?', subject: 'Proyecto de Sistemas III · PRS3T6', supporters: 11, resolved: true, tags: ['requisitos', 'validación'], body: 'En el equipo aparecen solicitudes nuevas y me cuesta redactar criterios claros para saber cuándo una tarea está completa.', explanation: 'Convierte cada necesidad en un resultado observable y escribe criterios de aceptación comprobables. Revisa esos criterios con el equipo antes de implementar y acuerda qué queda fuera de esta entrega. Así una tarea termina cuando la evidencia cumple lo acordado, no cuando parece suficientemente lista.' },
  { title: '¿Cómo evaluar si una tecnología emergente aporta valor?', subject: 'Tecnologías Emergentes I · TEM1T6', supporters: 8, tags: ['innovación', 'evaluación'], body: 'Me cuesta comparar una tecnología nueva con una solución conocida sin dejarme llevar solo por lo novedoso.' },
  { title: '¿Cómo diseñar interacciones cómodas en realidad aumentada?', subject: 'Realidad Virtual y Aumentada · RVA1T6', supporters: 6, tags: ['realidad aumentada', 'interacción'], body: 'Quiero elegir gestos y controles que sean intuitivos sin saturar la pantalla ni cansar a la persona usuaria.' },
  { title: '¿Qué evidencia demuestra que una ruta está bien configurada?', subject: 'Redes y Comunicación de Datos II · RED2T6', supporters: 3, tags: ['enrutamiento', 'laboratorio'], body: 'Además de que exista conectividad, ¿qué pruebas conviene presentar para justificar la configuración de la ruta?' },
]

export function createDatabase(filename = ':memory:') {
  const db = new Database(filename)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_key TEXT NOT NULL,
      subject TEXT NOT NULL,
      summary TEXT NOT NULL,
      supporters INTEGER NOT NULL DEFAULT 0 CHECK (supporters >= 0),
      resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
      explanation TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS topics_title_subject_unique ON topics(title_key, subject);
    CREATE INDEX IF NOT EXISTS topics_subject_idx ON topics(subject);
    CREATE INDEX IF NOT EXISTS topics_updated_idx ON topics(updated_at DESC);
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      author TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS questions_topic_idx ON questions(topic_id, created_at DESC);
  `)
  const count = db.prepare('SELECT COUNT(*) AS total FROM topics').get().total
  if (count === 0) seedDatabase(db)
  return db
}

function seedDatabase(db) {
  const now = new Date().toISOString()
  const insertTopic = db.prepare(`INSERT INTO topics (title, title_key, subject, summary, supporters, resolved, explanation, tags, created_at, updated_at)
    VALUES (@title, @titleKey, @subject, @summary, @supporters, @resolved, @explanation, @tags, @createdAt, @updatedAt)`)
  const insertQuestion = db.prepare('INSERT INTO questions (topic_id, body, author, created_at) VALUES (?, ?, ?, ?)')
  const transaction = db.transaction(() => {
    for (const [index, topic] of SEED_TOPICS.entries()) {
      const result = insertTopic.run({
        title: topic.title,
        titleKey: `${topic.subject.toLocaleLowerCase('es')}::${normalizeTitle(topic.title)}`,
        subject: topic.subject,
        summary: makeSummary(topic.body),
        supporters: topic.supporters,
        resolved: topic.resolved ? 1 : 0,
        explanation: topic.explanation ?? null,
        tags: JSON.stringify(topic.tags),
        createdAt: new Date(Date.now() - (index + 2) * 86_400_000).toISOString(),
        updatedAt: new Date(Date.now() - index * 5_400_000).toISOString(),
      })
      insertQuestion.run(result.lastInsertRowid, topic.body, null, now)
      if (topic.resolved) insertQuestion.run(result.lastInsertRowid, '¿Podrían compartir una forma sencilla de comprobar que ya domino este tema?', 'Estudiante anónimo', now)
    }
  })
  transaction()
}

export function mapTopic(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    summary: row.summary,
    supporters: row.supporters,
    resolved: Boolean(row.resolved),
    explanation: row.explanation,
    tags: JSON.parse(row.tags || '[]'),
    questionsCount: row.questions_count ?? 0,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  }
}

export function listTopics(db, filters = {}) {
  const where = []
  const params = {}
  if (filters.course) { where.push('t.subject = @course'); params.course = filters.course }
  if (filters.status !== undefined && filters.status !== null) { where.push('t.resolved = @resolved'); params.resolved = filters.status ? 1 : 0 }
  if (filters.q) {
    where.push('(LOWER(t.title) LIKE @query OR LOWER(t.subject) LIKE @query OR LOWER(t.summary) LIKE @query)')
    params.query = `%${filters.q.toLocaleLowerCase('es')}%`
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return db.prepare(`SELECT t.*, COUNT(q.id) AS questions_count FROM topics t LEFT JOIN questions q ON q.topic_id = t.id ${clause} GROUP BY t.id ORDER BY t.supporters DESC, t.updated_at DESC`).all(params).map(mapTopic)
}

export function getTopicById(db, id) {
  const row = db.prepare(`SELECT t.*, COUNT(q.id) AS questions_count FROM topics t LEFT JOIN questions q ON q.topic_id = t.id WHERE t.id = ? GROUP BY t.id`).get(id)
  if (!row) return null
  const topic = mapTopic(row)
  topic.questions = db.prepare('SELECT id, body, author, created_at AS createdAt FROM questions WHERE topic_id = ? ORDER BY created_at DESC, id DESC').all(id)
  return topic
}

export function createQuestion(db, input, titleKey) {
  const now = new Date().toISOString()
  const existing = db.prepare('SELECT id FROM topics WHERE title_key = ? AND subject = ?').get(titleKey, input.subject)
  const transaction = db.transaction(() => {
    let topicId = existing?.id
    if (topicId) {
      db.prepare('UPDATE topics SET supporters = supporters + 1, updated_at = ? WHERE id = ?').run(now, topicId)
    } else {
      const created = db.prepare(`INSERT INTO topics (title, title_key, subject, summary, supporters, resolved, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, 0, '[]', ?, ?)`).run(input.title, titleKey, input.subject, makeSummary(input.body), now, now)
      topicId = created.lastInsertRowid
    }
    db.prepare('INSERT INTO questions (topic_id, body, author, created_at) VALUES (?, ?, ?, ?)').run(topicId, input.body, input.author, now)
    return topicId
  })
  const id = transaction()
  return getTopicById(db, id)
}
