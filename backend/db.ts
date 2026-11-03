import { neon } from '@neondatabase/serverless'
import type { WishlistedPokemon } from './app.js'

const databaseUrl = process.env.DATABASE_URL
const sql = databaseUrl ? neon(databaseUrl) : null

export const isDatabaseConfigured = sql !== null

export async function initializeDatabase() {
  if (!sql) {
    return
  }

  await sql`
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      types JSONB
    )
  `
}

export async function readDatabaseWishlist(): Promise<WishlistedPokemon[]> {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured')
  }

  const rows = await sql`
    SELECT id, name, image, types
    FROM wishlist
    ORDER BY id
  `

  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    image: String(row.image),
    ...(Array.isArray(row.types) ? { types: row.types as string[] } : {}),
  }))
}

export async function insertDatabasePokemon(pokemon: WishlistedPokemon) {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured')
  }

  const existing = await sql`
    SELECT id
    FROM wishlist
    WHERE id = ${pokemon.id}
  `

  if (existing.length > 0) {
    return false
  }

  const count = await sql`SELECT COUNT(*)::int AS count FROM wishlist`
  if (Number(count[0]?.count) >= 6) {
    return null
  }

  await sql`
    INSERT INTO wishlist (id, name, image, types)
    VALUES (
      ${pokemon.id},
      ${pokemon.name},
      ${pokemon.image},
      ${pokemon.types ? JSON.stringify(pokemon.types) : null}::jsonb
    )
  `

  return true
}

export async function deleteDatabasePokemon(id: number) {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured')
  }

  await sql`DELETE FROM wishlist WHERE id = ${id}`
}
