export const MAX_WISHLIST_SIZE = 6

export interface WishlistedPokemon {
  id: number
  name: string
  image: string
  types?: string[]
}

export function useWishlist() {
  const wishlist = useState<WishlistedPokemon[]>('wishlist', () => [])
  const apiError = useState<string | null>('wishlist-api-error', () => null)
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const add = async (pokemon: WishlistedPokemon) => {
    try {
      const response = await $fetch<{ wishlist: WishlistedPokemon[] }>(
        `${apiBase}/wishlist`,
        {
          method: 'POST',
          body: pokemon,
        },
      )
      wishlist.value = response.wishlist
      apiError.value = null
    } catch {
      apiError.value = 'Unable to save the wishlist. Please try again.'
    }
  }

  const remove = async (pokemonId: number) => {
    try {
      const response = await $fetch<{ wishlist: WishlistedPokemon[] }>(
        `${apiBase}/wishlist`,
        {
          method: 'DELETE',
          query: { id: pokemonId },
        },
      )
      wishlist.value = response.wishlist
      apiError.value = null
    } catch {
      apiError.value = 'Unable to update the wishlist. Please try again.'
    }
  }

  onMounted(async () => {
    try {
      const response = await $fetch<{ wishlist: WishlistedPokemon[] }>(
        `${apiBase}/wishlist`,
      )
      wishlist.value = response.wishlist
      apiError.value = null
    } catch {
      apiError.value = 'Unable to load the wishlist. Please try again.'
    }
  })

  return {
    wishlist,
    apiError,
    addToWishList: add,
    removeFromWishList: remove,
  }
}
