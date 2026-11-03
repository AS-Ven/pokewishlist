import { describe, expect, it, vi } from 'vitest'
import { loadPokemonDetails, type PokemonDetail } from './pokemonApi'

describe('loadPokemonDetails', () => {
  it('skips a Pokemon when its API request returns a 404', async () => {
    const fetcher = vi.fn(async (url: string): Promise<PokemonDetail> => {
      if (url.endsWith('/missing')) {
        throw new Error('404 Pokemon not found')
      }

      return {
        id: 25,
        name: 'pikachu',
        sprites: { front_default: '/pikachu.png' },
        types: [{ type: { name: 'electric', url: '/types/electric' } }],
      }
    })

    const pokemon = await loadPokemonDetails(
      [
        { name: 'pikachu', url: '/pokemon/pikachu' },
        { name: 'missing', url: '/pokemon/missing' },
      ],
      fetcher,
    )

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(pokemon).toEqual([
      {
        id: 25,
        name: 'pikachu',
        image: '/pikachu.png',
        types: ['electric'],
      },
    ])
  })
})
