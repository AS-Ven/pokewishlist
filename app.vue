<script setup lang="ts">
import type { WishlistedPokemon } from './composables/useWishlist'

interface ApiResource {
  name: string
  url: string
}

interface PokemonListResponse {
  results: ApiResource[]
  count: number
}

interface PokemonDetail {
  id: number
  name: string
  sprites: {
    front_default: string | null
  }
  types: Array<{ type: ApiResource }>
}

interface TypeResponse {
  pokemon: Array<{ pokemon: ApiResource }>
}

const { wishlist, addToWishList, removeFromWishList } = useWishlist()
const wishlistOpen = ref(false)
const searchQuery = ref('')
const selectedTypeOne = ref('all')
const selectedTypeTwo = ref('all')
const pokemonList = ref<Array<WishlistedPokemon & { types: string[] }>>([])
const globalPokemonList = ref<Array<WishlistedPokemon & { types: string[] }>>([])
const searchResources = ref<ApiResource[]>([])
const searching = ref(false)
const searchMode = ref(false)
const loading = ref(true)
const loadingMore = ref(false)
const error = ref<Error | null>(null)
const totalPokemon = ref(0)
const globalTotalPokemon = ref(0)
const loadedCount = ref(0)
const pageSize = 100
const pokemonTypes = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
  'dragon', 'dark', 'steel', 'fairy'
]

const loadPokemonDetails = async (resources: ApiResource[]) => {
  const details = await Promise.all(
    resources.map(pokemon => $fetch<PokemonDetail>(pokemon.url))
  )

  return details.map(detail => ({
    id: detail.id,
    name: detail.name,
    image: detail.sprites.front_default
      ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${detail.id}.png`,
    types: detail.types.map(entry => entry.type.name)
  }))
}

const loadPokemonPage = async (offset: number) => {
  const page = await $fetch<PokemonListResponse>(
    `https://pokeapi.co/api/v2/pokemon?limit=${pageSize}&offset=${offset}`
  )

  return {
    pokemon: await loadPokemonDetails(page.results),
    count: page.count
  }
}

try {
  const firstPage = await loadPokemonPage(0)
  pokemonList.value = firstPage.pokemon
  globalPokemonList.value = firstPage.pokemon
  totalPokemon.value = firstPage.count
  globalTotalPokemon.value = firstPage.count
  loadedCount.value = firstPage.pokemon.length
} catch (loadError) {
  error.value = loadError instanceof Error ? loadError : new Error('Unable to load Pokémon')
} finally {
  loading.value = false
}

const types = computed(() => [
  'all',
  ...pokemonTypes
])

const filteredPokemon = computed(() =>
  pokemonList.value.filter((pokemon) => {
    const matchesName = pokemon.name.includes(searchQuery.value.trim().toLowerCase())
    const matchesFirstType = selectedTypeOne.value === 'all'
      || pokemon.types.includes(selectedTypeOne.value)
    const matchesSecondType = selectedTypeTwo.value === 'all'
      || pokemon.types.includes(selectedTypeTwo.value)

    return matchesName && matchesFirstType && matchesSecondType
  })
)

const hasMorePokemon = computed(() => loadedCount.value < totalPokemon.value)

let searchRequest = 0

watch([searchQuery, selectedTypeOne, selectedTypeTwo], async ([nameValue, typeOne, typeTwo]) => {
  const query = nameValue.trim().toLowerCase()
  const hasTypeFilter = typeOne !== 'all' || typeTwo !== 'all'

  if (!query && !hasTypeFilter) {
    searchRequest++
    searching.value = false
    searchMode.value = false
    pokemonList.value = globalPokemonList.value
    totalPokemon.value = globalTotalPokemon.value
    loadedCount.value = globalPokemonList.value.length
    error.value = null
    return
  }

  const requestId = ++searchRequest
  searchMode.value = true
  searching.value = true
  loading.value = true
  error.value = null

  try {
    let matches: ApiResource[]

    if (query) {
      const allPokemon = await $fetch<PokemonListResponse>(
        'https://pokeapi.co/api/v2/pokemon?limit=10000'
      )
      matches = allPokemon.results.filter(pokemon => pokemon.name.includes(query))
    }

    const typeNames = [typeOne, typeTwo].filter(type => type !== 'all')
    if (typeNames.length > 0) {
      const typeResponses = await Promise.all(
        typeNames.map(type => $fetch<TypeResponse>(`https://pokeapi.co/api/v2/type/${type}`))
      )
      const typeMatches = typeResponses.map(response =>
        new Set(response.pokemon.map(entry => entry.pokemon.url))
      )
      if (query) {
        matches = matches.filter(pokemon =>
          typeMatches.every(typeMatch => typeMatch.has(pokemon.url))
        )
      } else {
        matches = typeResponses[0].pokemon
          .filter(entry => typeMatches.every(typeMatch => typeMatch.has(entry.pokemon.url)))
          .map(entry => entry.pokemon)
      }
    } else {
      const allPokemon = await $fetch<PokemonListResponse>(
        'https://pokeapi.co/api/v2/pokemon?limit=10000'
      )
      matches = allPokemon.results.filter(pokemon => pokemon.name.includes(query))
    }

    if (requestId !== searchRequest) {
      return
    }

    searchResources.value = matches
    totalPokemon.value = matches.length
    const firstMatches = matches.slice(0, pageSize)
    const firstPokemon = await loadPokemonDetails(firstMatches)
    if (requestId !== searchRequest) {
      return
    }
    pokemonList.value = firstPokemon
    loadedCount.value = firstMatches.length
  } catch (loadError) {
    if (requestId === searchRequest) {
      error.value = loadError instanceof Error
        ? loadError
        : new Error('Unable to search Pokémon')
    }
  } finally {
    if (requestId === searchRequest) {
      loading.value = false
      searching.value = false
    }
  }
})

const loadMorePokemon = async () => {
  if (loadingMore.value || !hasMorePokemon.value) {
    return
  }

  loadingMore.value = true
  error.value = null

  try {
    if (searchMode.value) {
      const nextMatches = searchResources.value.slice(loadedCount.value, loadedCount.value + pageSize)
      pokemonList.value.push(...await loadPokemonDetails(nextMatches))
      loadedCount.value += nextMatches.length
    } else {
      const nextPage = await loadPokemonPage(loadedCount.value)
      pokemonList.value.push(...nextPage.pokemon)
      globalPokemonList.value.push(...nextPage.pokemon)
      loadedCount.value += nextPage.pokemon.length
    }
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError : new Error('Unable to load more Pokémon')
  } finally {
    loadingMore.value = false
  }
}

const isWishlisted = (pokemonId: number) =>
  wishlist.value.some(pokemon => pokemon.id === pokemonId)
</script>

<template>
  <div class="app-shell">
    <main class="content">
      <header class="hero">
        <p class="eyebrow">Pokédex collection</p>
        <h1>Poké Wishlist</h1>
        <p>Browse every Pokémon, filter by type, and save your favorites.</p>
      </header>

      <section aria-labelledby="available-pokemon">
        <div class="section-heading">
          <h2 id="available-pokemon">All Pokémon</h2>
          <div class="filters">
            <label>
              Search by name
              <input v-model="searchQuery" type="search" placeholder="e.g. pikachu">
            </label>
            <label>
              Type 1
              <select v-model="selectedTypeOne">
                <option v-for="type in types" :key="`first-${type}`" :value="type">
                  {{ type === 'all' ? 'Any type' : type }}
                </option>
              </select>
            </label>
            <label>
              Type 2
              <select v-model="selectedTypeTwo">
                <option v-for="type in types" :key="`second-${type}`" :value="type">
                  {{ type === 'all' ? 'Any type' : type }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <p v-if="loading" class="message">Loading the first 100 Pokémon...</p>
        <p v-else-if="error" class="message error">Unable to load Pokémon from PokeAPI.</p>
        <div v-else class="pokemon-grid">
          <article v-for="pokemon in filteredPokemon" :key="pokemon.id" class="pokemon-card">
            <img :src="pokemon.image" :alt="`${pokemon.name} sprite`">
            <div class="card-content">
              <p class="pokemon-number">#{{ String(pokemon.id).padStart(4, '0') }}</p>
              <h3>{{ pokemon.name }}</h3>
              <div class="type-list" aria-label="Types">
                <span v-for="type in pokemon.types" :key="type" class="type-badge">
                  {{ type }}
                </span>
              </div>
              <button
                type="button"
                :disabled="isWishlisted(pokemon.id)"
                @click="addToWishList(pokemon)"
              >
                {{ isWishlisted(pokemon.id) ? 'Wishlisted' : 'Add to wishlist' }}
              </button>
            </div>
          </article>
        </div>
        <p v-if="!loading && !error && filteredPokemon.length === 0" class="message">
          No Pokémon match these filters.
        </p>
        <button
          v-if="!loading && hasMorePokemon"
          class="load-more"
          type="button"
          :disabled="loadingMore"
          @click="loadMorePokemon"
        >
          {{ loadingMore ? 'Loading...' : 'Load 100 more Pokémon' }}
        </button>
      </section>
    </main>

    <button
      class="wishlist-toggle"
      type="button"
      :aria-expanded="wishlistOpen"
      aria-controls="wishlist-sidebar"
      @click="wishlistOpen = !wishlistOpen"
    >
      Wishlist ({{ wishlist.length }})
    </button>

    <aside
      id="wishlist-sidebar"
      class="wishlist-sidebar"
      :class="{ 'is-open': wishlistOpen }"
      aria-labelledby="wishlist-title"
    >
      <div class="sidebar-heading">
        <h2 id="wishlist-title">My wishlist</h2>
        <button type="button" aria-label="Close wishlist" @click="wishlistOpen = false">
          &times;
        </button>
      </div>
      <p v-if="wishlist.length === 0" class="message">Your wishlist is empty.</p>
      <ul v-else class="wishlist-list">
        <li v-for="pokemon in wishlist" :key="pokemon.id">
          <img :src="pokemon.image" :alt="`${pokemon.name} sprite`">
          <div>
            <strong>{{ pokemon.name }}</strong>
            <div class="type-list">
              <span v-for="type in pokemon.types ?? []" :key="type" class="type-badge">
                {{ type }}
              </span>
            </div>
          </div>
          <button type="button" :aria-label="`Remove ${pokemon.name}`" @click="removeFromWishList(pokemon.id)">
            &times;
          </button>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style>
:root {
  color: #172033;
  background: #f4f6fb;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button, select {
  font: inherit;
}

button {
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
}

.content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 48px 112px 64px 32px;
}

.hero {
  margin-bottom: 36px;
}

.eyebrow, .pokemon-number {
  color: #667085;
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

h1, h2, h3, p {
  margin-top: 0;
}

h1 {
  margin-bottom: 8px;
  font-size: clamp(2.4rem, 5vw, 4.5rem);
}

.hero > p:last-child {
  color: #667085;
  font-size: 1.1rem;
}

.section-heading {
  align-items: end;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.section-heading h2 {
  margin-bottom: 0;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

label {
  color: #667085;
  display: grid;
  font-size: .85rem;
  font-weight: 600;
  gap: 6px;
}

select {
  background: white;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  color: #172033;
  min-width: 170px;
  padding: 9px 12px;
}

input {
  background: white;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  color: #172033;
  min-width: 190px;
  padding: 9px 12px;
}

.pokemon-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
}

.pokemon-card {
  background: white;
  border: 1px solid #e4e7ec;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgb(16 24 40 / 5%);
  overflow: hidden;
  transition: transform .2s, box-shadow .2s;
}

.pokemon-card:hover {
  box-shadow: 0 12px 24px rgb(16 24 40 / 10%);
  transform: translateY(-3px);
}

.pokemon-card > img {
  background: #eef2ff;
  display: block;
  height: 150px;
  object-fit: contain;
  width: 100%;
}

.card-content {
  padding: 14px;
}

.pokemon-number {
  font-size: .7rem;
  margin-bottom: 4px;
}

.pokemon-card h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  text-transform: capitalize;
}

.type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.type-badge {
  background: #eef2ff;
  border-radius: 999px;
  color: #4654a3;
  font-size: .72rem;
  padding: 4px 8px;
  text-transform: capitalize;
}

.pokemon-card button {
  background: #4654a3;
  border: 0;
  border-radius: 8px;
  color: white;
  margin-top: 14px;
  padding: 9px 10px;
  width: 100%;
}

.pokemon-card button:disabled {
  background: #d0d5dd;
  cursor: default;
}

.load-more {
  background: #4654a3;
  border: 0;
  border-radius: 8px;
  color: white;
  display: block;
  font-weight: 700;
  margin: 32px auto 0;
  padding: 12px 20px;
}

.load-more:disabled {
  cursor: wait;
  opacity: .7;
}

.wishlist-toggle {
  background: #4654a3;
  border: 0;
  border-radius: 10px 0 0 10px;
  color: white;
  font-weight: 700;
  padding: 14px 18px;
  position: fixed;
  right: 0;
  top: 24px;
  z-index: 3;
}

.wishlist-sidebar {
  background: white;
  box-shadow: -8px 0 24px rgb(16 24 40 / 12%);
  height: 100vh;
  overflow-y: auto;
  padding: 28px 20px;
  position: fixed;
  right: 0;
  top: 0;
  transform: translateX(100%);
  transition: transform .25s ease;
  width: min(360px, 90vw);
  z-index: 4;
}

.wishlist-sidebar.is-open {
  transform: translateX(0);
}

.sidebar-heading {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

.sidebar-heading h2 {
  margin-bottom: 0;
}

.sidebar-heading button, .wishlist-list button {
  background: transparent;
  border: 0;
  color: #667085;
  font-size: 1.5rem;
}

.wishlist-list {
  display: grid;
  gap: 14px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.wishlist-list li {
  align-items: center;
  border-bottom: 1px solid #eaecf0;
  display: grid;
  gap: 10px;
  grid-template-columns: 52px 1fr auto;
  padding-bottom: 14px;
}

.wishlist-list img {
  background: #eef2ff;
  border-radius: 10px;
  height: 52px;
  object-fit: contain;
  width: 52px;
}

.wishlist-list strong {
  display: block;
  margin-bottom: 5px;
  text-transform: capitalize;
}

.message {
  color: #667085;
}

.error {
  color: #b42318;
}

@media (max-width: 640px) {
  .content {
    padding: 32px 20px 48px;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .filters {
    justify-content: stretch;
  }

  .filters label, .filters input, .filters select {
    width: 100%;
  }
}
</style>
