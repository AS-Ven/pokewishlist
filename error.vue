<script setup lang="ts">
const { t } = useTranslations()

defineProps<{
  error: {
    statusCode?: number
    statusMessage?: string
  }
}>()
</script>

<template>
  <main class="error-page">
    <p class="error-code">{{ error.statusCode ?? 500 }}</p>
    <h1>{{ error.statusMessage ?? t('somethingWentWrong') }}</h1>
    <p>{{ t('pokemonNotFound') }}</p>
    <NuxtLink class="home-link" to="/">{{ t('returnHome') }}</NuxtLink>
  </main>
</template>

<style scoped>
.error-page {
  display: grid;
  min-height: 100vh;
  place-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #172033;
  background: #f4f6fb;
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
  padding: 0.7rem 1rem;
  color: white;
  background: #3559a8;
  border-radius: 0.5rem;
  font-weight: 700;
  text-decoration: none;
}
</style>
