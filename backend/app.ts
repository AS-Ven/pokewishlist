import { Hono } from 'hono'
import { cors } from 'hono/cors'

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

app.get('/wishlist', (context) => context.json({ wishlist }))

app.post('/wishlist', async (context) => {
  const body: unknown = await context.req.json().catch(() => null)

  if (!isWishlistedPokemon(body)) {
    return context.json({ error: 'Invalid Pokémon payload' }, 400)
  }

  if (wishlist.some((pokemon) => pokemon.id === body.id)) {
    console.log("this should break the CI");
    
    return context.json({ wishlist })
  }

  if (wishlist.length >= MAX_WISHLIST_SIZE) {
    return context.json({ error: 'Wishlist limit reached' }, 409)
  }

  wishlist.push(body)
  return context.json({ wishlist }, 201)
})

app.delete('/wishlist', (context) => {
  const id = Number(context.req.query('id'))

  if (!Number.isInteger(id)) {
    return context.json({ error: 'A valid Pokémon id is required' }, 400)
  }

  const index = wishlist.findIndex((pokemon) => pokemon.id === id)
  if (index >= 0) {
    wishlist.splice(index, 1)
  }

  return context.json({ wishlist })
})
