import { beforeEach, describe, expect, it } from 'vitest'
import { vi } from 'vitest'
import { loadPokemonDetails, type PokemonDetail } from './pokemonApi'
import { addToWishList } from './useWishlist'

describe('addToWishList', () => {
  let storage: Storage

  beforeEach(() => {
    storage = new StorageMock()
  })

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

  it('adds a Pokemon to the wishlist and persists it', () => {
    const pokemon = { id: 25, name: 'pikachu', image: '/pikachu.png' }

    const wishlist = addToWishList(pokemon, storage)

    expect(wishlist).toEqual([pokemon])
    expect(JSON.parse(storage.getItem('poke-wishlist')!)).toEqual([pokemon])
  })

  it('does not add the same Pokemon twice', () => {
    const pokemon = { id: 25, name: 'pikachu', image: '/pikachu.png' }
    addToWishList(pokemon, storage)

    expect(addToWishList(pokemon, storage)).toEqual([pokemon])
  })

  it('does not add more than six Pokemon', () => {
    const pokemon = (id: number) => ({
      id,
      name: `pokemon-${id}`,
      image: `/pokemon-${id}.png`,
    })

    for (let id = 1; id <= 6; id++) {
      addToWishList(pokemon(id), storage)
    }

    const wishlist = addToWishList(pokemon(7), storage)

    expect(wishlist).toHaveLength(6)
    expect(wishlist.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6])
    expect(JSON.parse(storage.getItem('poke-wishlist')!)).toHaveLength(6)
  })
})

class StorageMock implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}
