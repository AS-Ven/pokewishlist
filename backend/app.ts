import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  deleteDatabasePokemon,
  insertDatabasePokemon,
  isDatabaseConfigured,
  readDatabaseWishlist,
} from './db.js'
import { translateBackend } from './translations.js'

export interface WishlistedPokemon {
  id: number
  name: string
  image: string
  types?: string[]
}

export const MAX_WISHLIST_SIZE = 6

const isWishlistedPokemon = (value: unknown): value is WishlistedPokemon => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const pokemon = value as Record<string, unknown>
  return (
    Number.isInteger(pokemon.id) &&
    typeof pokemon.name === 'string' &&
    typeof pokemon.image === 'string' &&
    (pokemon.types === undefined ||
      (Array.isArray(pokemon.types) &&
        pokemon.types.every((type) => typeof type === 'string')))
  )
}

export const wishlist: WishlistedPokemon[] = []

export const app = new Hono()

app.use('*', cors())

app.get('/wishlist', async (context) => {
  const currentWishlist = isDatabaseConfigured
    ? await readDatabaseWishlist()
    : wishlist

  return context.json({ wishlist: currentWishlist })
})

app.post('/wishlist', async (context) => {
  const body: unknown = await context.req.json().catch(() => null)

  if (!isWishlistedPokemon(body)) {
    return context.json(
      {
        error: translateBackend(
          'invalidPokemonPayload',
          context.req.header('Accept-Language'),
        ),
      },
      400,
    )
  }

  if (isDatabaseConfigured) {
    const result = await insertDatabasePokemon(body)
    if (result === null) {
      return context.json(
        {
          error: translateBackend(
            'wishlistLimitReached',
            context.req.header('Accept-Language'),
          ),
        },
        409,
      )
    }

    return context.json(
      { wishlist: await readDatabaseWishlist() },
      result ? 201 : 200,
    )
  }

  if (wishlist.some((pokemon) => pokemon.id === body.id)) {
    return context.json({ wishlist })
  }

  if (wishlist.length >= MAX_WISHLIST_SIZE) {
    return context.json(
      {
        error: translateBackend(
          'wishlistLimitReached',
          context.req.header('Accept-Language'),
        ),
      },
      409,
    )
  }

  wishlist.push(body)
  return context.json({ wishlist }, 201)
})

app.delete('/wishlist', async (context) => {
  const id = Number(context.req.query('id'))

  if (!Number.isInteger(id)) {
    return context.json(
      {
        error: translateBackend(
          'validPokemonIdRequired',
          context.req.header('Accept-Language'),
        ),
      },
      400,
    )
  }

  if (isDatabaseConfigured) {
    await deleteDatabasePokemon(id)
    return context.json({ wishlist: await readDatabaseWishlist() })
  }

  const index = wishlist.findIndex((pokemon) => pokemon.id === id)
  if (index >= 0) {
    wishlist.splice(index, 1)
  }

  return context.json({ wishlist })
})
