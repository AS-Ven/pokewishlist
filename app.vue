<script setup lang="ts">
import type { WishlistedPokemon } from './composables/useWishlist'

interface ApiPokemon {
  name: string
  url: string
}

const { wishlist, addToWishList, removeFromWishList } = useWishlist()
const { data, error, status } = await useFetch<{ results: ApiPokemon[] }>(
  'https://pokeapi.co/api/v2/pokemon?limit=20'
)

const pokemonList = computed<WishlistedPokemon[]>(() =>
  (data.value?.results ?? []).map((pokemon) => {
    const id = Number(pokemon.url.split('/').filter(Boolean).pop())
    return {
      id,
      name: pokemon.name,
      image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
    }
  })
)

const isWishlisted = (pokemonId: number) =>
  wishlist.value.some(pokemon => pokemon.id === pokemonId)
</script>

<template>
  <main>
    <h1>Poké Wishlist</h1>
    <p>Choose your favorite Pokémon and keep them close.</p>

    <section aria-labelledby="available-pokemon">
      <h2 id="available-pokemon">Pokémon</h2>
      <p v-if="status === 'pending'">Loading Pokémon...</p>
      <p v-else-if="error">Unable to load Pokémon from PokeAPI.</p>
      <ul v-else>
        <li v-for="pokemon in pokemonList" :key="pokemon.id">
          <img :src="pokemon.image" :alt="pokemon.name">
          <span>{{ pokemon.name }}</span>
          <button
            type="button"
            :disabled="isWishlisted(pokemon.id)"
            @click="addToWishList(pokemon)"
          >
            {{ isWishlisted(pokemon.id) ? 'Wishlisted' : 'Add to wishlist' }}
          </button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="wishlist">
      <h2 id="wishlist">My wishlist ({{ wishlist.length }})</h2>
      <p v-if="wishlist.length === 0">Your wishlist is empty.</p>
      <ul v-else>
        <li v-for="pokemon in wishlist" :key="pokemon.id">
          <span>{{ pokemon.name }}</span>
          <button type="button" @click="removeFromWishList(pokemon.id)">
            Remove
          </button>
        </li>
      </ul>
    </section>
  </main>
</template>
