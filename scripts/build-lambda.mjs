import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'esbuild'

const outputDirectory = join(process.cwd(), 'infra', 'lambda-dist')

await rm(outputDirectory, { recursive: true, force: true })
await mkdir(outputDirectory, { recursive: true })

await build({
  entryPoints: ['backend/lambda.ts'],
  bundle: true,
  format: 'esm',
  minify: true,
  platform: 'node',
  target: 'node22',
  outfile: join(outputDirectory, 'index.js'),
  sourcemap: true,
  external: ['@aws-sdk/*'],
})

await writeFile(
  join(outputDirectory, 'package.json'),
  JSON.stringify({ type: 'module' }),
)
