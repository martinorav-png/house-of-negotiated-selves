import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = path.resolve(root, '../mock-ui/assets')
const dstDir = path.join(root, 'public/assets/personas')

mkdirSync(dstDir, { recursive: true })

for (let i = 1; i <= 5; i++) {
  copyFileSync(path.join(srcDir, `char${i}.png`), path.join(dstDir, `persona-${i}.png`))
  console.log(`synced char${i}.png -> persona-${i}.png`)
}
