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
  const apiError = useState<string | null>('wishlist-api-error', () => null)
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  if (import.meta.client && wishlist.value.length === 0) {
    wishlist.value = readWishlist()
  }

  const add = (pokemon: WishlistedPokemon) => {
    wishlist.value = addToWishList(pokemon)
    if (import.meta.client) {
      void $fetch(`${apiBase}/wishlist`, {
        method: 'POST',
        body: pokemon,
      }).catch(() => {
        apiError.value = 'Wishlist API unavailable; using LocalStorage.'
      })
    }
  }

  const remove = (pokemonId: number) => {
    wishlist.value = removeFromWishList(pokemonId)
    if (import.meta.client) {
      void $fetch(`${apiBase}/wishlist`, {
        method: 'DELETE',
        query: { id: pokemonId },
      }).catch(() => {
        apiError.value = 'Wishlist API unavailable; using LocalStorage.'
      })
    }
  }

  onMounted(async () => {
    try {
      const response = await $fetch<{ wishlist: WishlistedPokemon[] }>(
        `${apiBase}/wishlist`,
      )
      wishlist.value = response.wishlist
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.wishlist))
    } catch {
      apiError.value = 'Wishlist API unavailable; using LocalStorage.'
    }
  })

  return {
    wishlist,
    apiError,
    addToWishList: add,
    removeFromWishList: remove,
  }
}
