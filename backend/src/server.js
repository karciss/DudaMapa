import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { createDatabase } from './database.js'

const here = dirname(fileURLToPath(import.meta.url))
const configuredDb = process.env.DB_FILE
const dataFile = configuredDb === ':memory:' ? ':memory:' : resolve(configuredDb || `${here}/../data/dudamapa.sqlite`)
if (dataFile !== ':memory:') mkdirSync(dirname(dataFile), { recursive: true })
const db = createDatabase(dataFile)
const app = createApp({ db })
const port = Number(process.env.PORT || 3000)
const server = app.listen(port, '0.0.0.0', () => console.log(`DudaMapa API escuchando en http://localhost:${port}`))

function shutdown() {
  server.close(() => {
    db.close()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
