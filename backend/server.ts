import { serve } from '@hono/node-server'
import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'

if (existsSync('.env.local')) {
  loadEnvFile('.env.local')
} else if (existsSync('.env')) {
  loadEnvFile('.env')
}

const { app } = await import('./app.js')
const { initializeDatabase } = await import('./db.js')

const port = Number(process.env.PORT ?? 8787)

await initializeDatabase()

serve({ fetch: app.fetch, port }, (info) => {
  process.stdout.write(
    `Wishlist API listening on http://localhost:${info.port}\n`,
  )
})
