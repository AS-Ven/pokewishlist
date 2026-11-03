<script setup lang="ts">
import type { PokemonDetail } from '../../composables/pokemonApi'

const route = useRoute()
const pokemonName = String(route.params.name)

const { data: pokemon, error: pokemonError } = await useAsyncData(
  `pokemon-${pokemonName}`,
  async () => {
    try {
      const detail = await $fetch<PokemonDetail>(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemonName)}`,
      )

      return {
        id: detail.id,
        name: detail.name,
        image:
          detail.sprites.front_default ??
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${detail.id}.png`,
        types: detail.types.map((entry) => entry.type.name),
      }
    } catch {
      return null
    }
  },
)

if (pokemonError.value || !pokemon.value) {
  setResponseStatus(404)
}
</script>

<template>
  <main v-if="pokemon" class="pokemon-page">
    <NuxtLink class="home-link" to="/">Return home</NuxtLink>
    <article class="pokemon-card">
      <img :src="pokemon.image" :alt="`${pokemon.name} sprite`" />
      <div class="card-content">
        <p class="pokemon-number">#{{ String(pokemon.id).padStart(4, '0') }}</p>
        <h1>{{ pokemon.name }}</h1>
        <div class="type-list" aria-label="Types">
          <span v-for="type in pokemon.types" :key="type" class="type-badge">
            {{ type }}
          </span>
        </div>
      </div>
    </article>
  </main>
  <main v-else class="error-page">
    <p class="error-code">404</p>
    <h1>Pokémon not found</h1>
    <p>We could not find “{{ pokemonName }}”.</p>
    <NuxtLink class="home-link" to="/">Return home</NuxtLink>
  </main>
</template>

<style scoped>
.pokemon-page,
.error-page {
  min-height: 100vh;
  padding: 3rem 1.5rem;
  background: #f4f6fb;
}

.error-page {
  display: grid;
  place-content: center;
  gap: 1rem;
  color: #172033;
  text-align: center;
}

.error-code {
  margin: 0;
  color: #3559a8;
  font-size: 4rem;
  font-weight: 800;
}

.home-link {
  justify-self: center;
  margin-bottom: 2rem;
  color: #3559a8;
  font-weight: 700;
}

.pokemon-card {
  display: flex;
  gap: 1.5rem;
  max-width: 32rem;
  margin: 0 auto;
  padding: 1.5rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1rem 2rem rgb(23 32 51 / 10%);
}

.pokemon-card > img {
  width: 10rem;
  height: 10rem;
  object-fit: contain;
}

.pokemon-number {
  color: #667085;
  font-weight: 700;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.type-badge {
  padding: 0.3rem 0.6rem;
  color: #3559a8;
  background: #e8efff;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
}
</style>
