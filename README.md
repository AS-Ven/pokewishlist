# Poke Wishlist

[![CI](https://github.com/AS-Ven/pokewishlist/actions/workflows/ci.yml/badge.svg)](https://github.com/AS-Ven/pokewishlist/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-Vitest%20CI-blue)](https://github.com/AS-Ven/pokewishlist/actions/workflows/ci.yml)

A Nuxt and Hono Pokémon wishlist application. Wishlist data is stored in Neon
Postgres, with the backend deployed to AWS Lambda/API Gateway and the static
frontend served through S3 and CloudFront.

## Requirements

- Node.js 26
- npm
- A Neon Postgres database for the backend

## Local development

Install dependencies:

```bash
npm ci
```

Create `.env.local` with the Neon connection string:

```dotenv
DATABASE_URL=postgresql://...
```

Start the Nuxt frontend and Hono API:

```bash
npm run dev
```

The frontend runs on Nuxt's local port and the API runs on
`http://localhost:8787`.

## Tests and checks

```bash
npm run test:front
npm run test:back
npm run test:db
npm run test:e2e
npm run test:coverage
```

`npm run test:coverage` writes the Vitest report to `coverage/`. The CI
workflow runs coverage after the frontend, backend, E2E, translation, type,
lint, formatting, and Neon checks, immediately before AWS deployment. A
coverage failure prevents deployment.

## Deployment

Pushes to `main` run the CI checks and deploy only when every required job
passes. GitHub Actions authenticates to AWS through OIDC using the
`GitHubActions-pokewishlist` IAM role.

The deployment:

1. Deploys the CDK stack.
2. Builds the static frontend with the deployed API URL.
3. Uploads the frontend to S3.
4. Invalidates CloudFront.
5. Verifies `GET /health` returns HTTP 200.

The repository needs these GitHub Actions secrets:

- `DATABASE_URL`: Neon connection string.

No AWS access-key secret is required. The workflow uses
`id-token: write` and the role's OIDC trust policy.

Current deployed URLs:

- Frontend: https://d3d2wbwdboo6ik.cloudfront.net
- API: https://s8ka9rdby3.execute-api.eu-west-3.amazonaws.com
- Health check: https://s8ka9rdby3.execute-api.eu-west-3.amazonaws.com/health
