import { expect, test } from '@nuxt/test-utils/playwright'
import type { WishlistedPokemon } from '../composables/useWishlist'

const pokemon = {
  pikachu: {
    id: 25,
    name: 'pikachu',
    image: 'https://example.test/pikachu.png',
    types: ['electric'],
  },
  charmander: {
    id: 4,
    name: 'charmander',
    image: 'https://example.test/charmander.png',
    types: ['fire'],
  },
  squirtle: {
    id: 7,
    name: 'squirtle',
    image: 'https://example.test/squirtle.png',
    types: ['water'],
  },
}

test.use({
  nuxt: {
    rootDir: process.cwd(),
    dev: true,
  },
})

test('completes the wishlist journey', async ({ page, goto }) => {
  const wishlist: WishlistedPokemon[] = []

  await page.route('http://localhost:8787/wishlist**', async (route) => {
    const request = route.request()

    if (request.method() === 'GET') {
      await route.fulfill({ json: { wishlist } })
      return
    }

    if (request.method() === 'POST') {
      wishlist.push(JSON.parse(request.postData() ?? '{}') as WishlistedPokemon)
      await route.fulfill({ status: 201, json: { wishlist } })
      return
    }

    if (request.method() === 'DELETE') {
      const id = Number(new URL(request.url()).searchParams.get('id'))
      wishlist.splice(
        0,
        wishlist.length,
        ...wishlist.filter((item) => item.id !== id),
      )
      await route.fulfill({ json: { wishlist } })
      return
    }

    await route.continue()
  })

  await page.route(
    'https://pokeapi.co/api/v2/pokemon?limit=10000',
    async (route) => {
      await route.fulfill({
        json: {
          count: 1,
          results: [
            {
              name: pokemon.squirtle.name,
              url: 'https://pokeapi.co/api/v2/pokemon/7',
            },
          ],
        },
      })
    },
  )

  await page.route('https://pokeapi.co/api/v2/pokemon/7', async (route) => {
    await route.fulfill({
      json: {
        id: pokemon.squirtle.id,
        name: pokemon.squirtle.name,
        sprites: { front_default: pokemon.squirtle.image },
        types: [{ type: { name: 'water', url: '/types/water' } }],
      },
    })
  })

  await goto('/', { waitUntil: 'hydration' })

  const pikachuCard = page.locator('.pokemon-card').filter({
    hasText: 'pikachu',
  })
  const charmanderCard = page.locator('.pokemon-card').filter({
    hasText: 'charmander',
  })

  await expect(pikachuCard).toBeVisible()
  await expect(charmanderCard).toBeVisible()
  await pikachuCard.getByRole('button', { name: 'Add to wishlist' }).click()
  await charmanderCard.getByRole('button', { name: 'Add to wishlist' }).click()

  await page.getByRole('button', { name: 'Wishlist (2)' }).click()
  await expect(
    page.getByRole('heading', { name: 'My wishlist (2/6)' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Remove pikachu' }).click()
  await page.getByRole('button', { name: 'Remove charmander' }).click()
  await expect(page.getByText('Your wishlist is empty.')).toBeVisible()

  await page.getByPlaceholder('e.g. pikachu').fill('squirtle')
  const squirtleCard = page.locator('.pokemon-card').filter({
    hasText: 'squirtle',
  })
  await expect(squirtleCard).toBeVisible()
  await squirtleCard.getByRole('button', { name: 'Add to wishlist' }).click()

  await expect(page.getByRole('button', { name: 'Wishlist (1)' })).toBeVisible()
  await expect(
    page.locator('.wishlist-list strong').filter({ hasText: 'squirtle' }),
  ).toBeVisible()
})
