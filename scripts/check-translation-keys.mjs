import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = new URL('../locales/', import.meta.url)

for (const area of ['front', 'back']) {
  const directory = new URL(`${area}/`, root)
  const files = (await readdir(directory)).filter((file) =>
    file.endsWith('.json'),
  )
  const reference = JSON.parse(
    await readFile(new URL('en.json', directory), 'utf8'),
  )
  const expected = Object.keys(reference).sort()

  for (const file of files) {
    const translation = JSON.parse(
      await readFile(new URL(file, directory), 'utf8'),
    )
    const actual = Object.keys(translation).sort()
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${area}/${file} keys do not match ${area}/en.json`)
    }
  }
}

console.log('Translation keys match en.json for front and back.')
