import { beforeEach, describe, expect, it } from 'vitest'
import { addToWishList } from './useWishlist'

describe('addToWishList', () => {
  let storage: Storage

  beforeEach(() => {
    storage = new StorageMock()
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
