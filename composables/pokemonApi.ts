import type { WishlistedPokemon } from './useWishlist'

export interface ApiResource {
  name: string
  url: string
}

export interface PokemonDetail {
  id: number
  name: string
  sprites: {
    front_default: string | null
  }
  types: Array<{ type: ApiResource }>
}

export type PokemonFetcher = (url: string) => Promise<PokemonDetail>

export async function loadPokemonDetails(
  resources: ApiResource[],
  fetcher: PokemonFetcher,
): Promise<Array<WishlistedPokemon & { types: string[] }>> {
  const details = await Promise.allSettled(
    resources.map((pokemon) => fetcher(pokemon.url)),
  )

  return details
    .filter(
      (result): result is PromiseFulfilledResult<PokemonDetail> =>
        result.status === 'fulfilled',
    )
    .map(({ value: detail }) => ({
      id: detail.id,
      name: detail.name,
      image:
        detail.sprites.front_default ??
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${detail.id}.png`,
      types: detail.types.map((entry) => entry.type.name),
    }))
}
