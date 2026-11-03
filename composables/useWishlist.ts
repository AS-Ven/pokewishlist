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
  const { t } = useTranslations()

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
      apiError.value = t('wishlistSaveError')
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
      apiError.value = t('wishlistUpdateError')
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
      apiError.value = t('wishlistLoadError')
    }
  })

  return {
    wishlist,
    apiError,
    addToWishList: add,
    removeFromWishList: remove,
  }
}
