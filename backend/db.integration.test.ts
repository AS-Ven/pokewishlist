import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { neon } from '@neondatabase/serverless'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

if (existsSync('.env.local')) {
  loadEnvFile('.env.local')
} else if (existsSync('.env')) {
  loadEnvFile('.env')
}

const databaseUrl = process.env.DATABASE_URL

describe('Neon database connection', () => {
  const sql = databaseUrl ? neon(databaseUrl) : null

  beforeAll(async () => {
    if (!sql) {
      throw new Error(
        'DATABASE_URL is required. Run neon env pull before running test:db.',
      )
    }

    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_db_test (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )
    `
    await sql`TRUNCATE TABLE wishlist_db_test`
  })

  afterAll(async () => {
    if (sql) {
      await sql`DROP TABLE IF EXISTS wishlist_db_test`
    }
  })

  it('can write, read, and delete a fake wishlist entry in Neon', async () => {
    if (!sql) {
      throw new Error('DATABASE_URL is not configured')
    }

    await sql`
      INSERT INTO wishlist_db_test (id, name)
      VALUES (987654, 'neon-db-test-pokemon')
    `

    const stored = await sql`
      SELECT id, name
      FROM wishlist_db_test
      WHERE id = 987654
    `

    expect(stored).toEqual([{ id: 987654, name: 'neon-db-test-pokemon' }])

    await sql`DELETE FROM wishlist_db_test WHERE id = 987654`

    const deleted = await sql`
      SELECT id
      FROM wishlist_db_test
      WHERE id = 987654
    `

    expect(deleted).toEqual([])
  })
})
