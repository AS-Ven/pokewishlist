const STORAGE_KEY = 'poke-wishlist'
export const MAX_WISHLIST_SIZE = 6

export interface WishlistedPokemon {
  id: number
  name: string
  image: string
  types?: string[]
}

export function addToWishList(
  pokemon: WishlistedPokemon,
  storage: Storage = localStorage,
): WishlistedPokemon[] {
  const wishlist = readWishlist(storage)

  if (
    !wishlist.some((item) => item.id === pokemon.id) &&
    wishlist.length < MAX_WISHLIST_SIZE
  ) {
    wishlist.push(pokemon)
    storage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
  }

  return wishlist
}

export function removeFromWishList(
  pokemonId: number,
  storage: Storage = localStorage,
): WishlistedPokemon[] {
  const wishlist = readWishlist(storage).filter((item) => item.id !== pokemonId)
  storage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
  return wishlist
}

export function readWishlist(
  storage: Storage = localStorage,
): WishlistedPokemon[] {
  const storedWishlist = storage.getItem(STORAGE_KEY)

  if (!storedWishlist) {
    return []
  }

  try {
    const wishlist = JSON.parse(storedWishlist)
    return Array.isArray(wishlist) ? wishlist : []
  } catch {
    return []
  }
}

export function useWishlist() {
  const wishlist = useState<WishlistedPokemon[]>('wishlist', () => [])

  if (import.meta.client && wishlist.value.length === 0) {
    wishlist.value = readWishlist()
  }

  const add = (pokemon: WishlistedPokemon) => {
    wishlist.value = addToWishList(pokemon)
  }

  const remove = (pokemonId: number) => {
    wishlist.value = removeFromWishList(pokemonId)
  }

  return { wishlist, addToWishList: add, removeFromWishList: remove }
}
