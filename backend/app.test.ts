import { beforeEach, describe, expect, it } from 'vitest'
import { app, wishlist } from './app.js'

const pokemon = (id: number) => ({
  id,
  name: `pokemon-${id}`,
  image: `/pokemon-${id}.png`,
  types: ['normal'],
})

describe('wishlist API', () => {
  beforeEach(() => {
    wishlist.length = 0
  })

  it('reports a healthy API', async () => {
    const response = await app.request('/health')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it('gets, creates, and deletes wishlist entries', async () => {
    const createResponse = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pokemon(1)),
    })

    expect(createResponse.status).toBe(201)
    expect((await createResponse.json()).wishlist).toEqual([pokemon(1)])

    const getResponse = await app.request('/wishlist')
    expect((await getResponse.json()).wishlist).toEqual([pokemon(1)])

    const deleteResponse = await app.request('/wishlist?id=1', {
      method: 'DELETE',
    })
    expect(deleteResponse.status).toBe(200)
    expect((await deleteResponse.json()).wishlist).toEqual([])
  })

  it('rejects invalid payloads and a seventh Pokemon', async () => {
    const invalidResponse = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'not-a-number' }),
    })
    expect(invalidResponse.status).toBe(400)

    const frenchInvalidResponse = await app.request('/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'fr',
      },
      body: JSON.stringify({ id: 'not-a-number' }),
    })
    expect((await frenchInvalidResponse.json()).error).toBe(
      'Données Pokémon invalides',
    )

    for (let id = 1; id <= 6; id++) {
      await app.request('/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pokemon(id)),
      })
    }

    const seventhResponse = await app.request('/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pokemon(7)),
    })

    expect(seventhResponse.status).toBe(409)
    expect(wishlist).toHaveLength(6)
  })
})
