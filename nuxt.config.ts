export default defineNuxtConfig({
  devtools: { enabled: false },
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:8787',
    },
  },
})
