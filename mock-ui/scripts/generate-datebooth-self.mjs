import { mkdir, writeFile, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stitch } from '@google/stitch-sdk'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const stitchDir = path.join(root, 'stitch')
const htmlDir = path.join(stitchDir, 'html')
const shotDir = path.join(stitchDir, 'screenshots')

const PROJECT_ID = '10208178277831799467'
const SLUG = '01-self-datebooth'

const PROMPT = `Design the Datebooth "01 SELF" station screen for the art installation "House of Negotiated Selves".

This is a portrait smart-mirror kiosk UI (9:16, ~1080x1920). Full-bleed digital screen only - no photos of physical rooms or hardware.

VISUAL SYSTEM (Datebooth - locked):
- Void background #0D0D0D (very subtle fine grain ok)
- Panel / question plate #1A1A1A
- Rose accent #F5B8C4 for ornaments, CTA, hero type, emphasis
- Rose bright #FFC9D4 for silhouette rim glow
- Text primary #F5F5F5, muted #7A7570
- Ink on rose buttons #0D0D0D
- Display type: Cormorant Garamond serif, all-caps, wide tracking, rose
- Body/UI: Manrope sans
- Thin 1px rose hairlines, circle-heart ornament, center diamonds, small solid hearts
- Boutique vitrine calm - romance retail, slightly uncanny, not dating-app swipe UI

SCREEN JOB (Self station - first intake question):
Collect visitor identity. Show ONE question at a time feel, but design the static comp for step 1.

Required content:
- Top: thin ornamental line-heart header (same family as Entry screen)
- Station label: "01 SELF" (small tracked caps, muted)
- Hero prompt (rose serif): "WHAT IS YOUR FULL GOVERNMENT NAME."
- Diamond hairline divider
- Dark plate with labeled field "Government name" and input placeholder "Type your full government name..."
- Debra coaching line (body sans, calm): "Now, just answer what comes up on the mirror. You can type it out on the keyboard in front of you"
- Side or lower vitrine: faceless companion silhouette with soft rose outline glow on low concentric pedestal; hanging rectangular price tag reading "AVAILABLE TONIGHT" with thread, dot, diamond, heart marks
- Primary CTA: full-width rose button with heart-key line icon + label "CONTINUE"
- Footer: three small diamonds (center emphasized)
- Optional subtle progress hint (e.g. thin rose progress hairline ~15%)

DO NOT USE:
- Soft Future blush/coral palette (#fef8f4, #a43a3d)
- Institutional phosphor green terminal aesthetic
- Landscape dashboard with side rail
- Glass orb mascot, photoreal faces, swipe cards, pill chip clusters
- Purple cyberpunk neon, scanlines, heavy glassmorphism

Copy is SFW. No em dashes in UI text.`

async function download(url, dest) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(dest, buf)
  return buf.length
}

async function upsertManifest(entry) {
  const manifestPath = path.join(stitchDir, 'manifest.json')
  let manifest = []
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch {
    manifest = []
  }
  const idx = manifest.findIndex((item) => item.slug === entry.slug)
  if (idx >= 0) manifest[idx] = { ...manifest[idx], ...entry }
  else manifest.push(entry)
  manifest.sort((a, b) => a.slug.localeCompare(b.slug))
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    throw new Error('STITCH_API_KEY is not set')
  }

  await mkdir(htmlDir, { recursive: true })
  await mkdir(shotDir, { recursive: true })

  const project = stitch.project(PROJECT_ID)
  console.log(`Generating on Stitch project ${PROJECT_ID}...`)

  const screen = await project.generate(PROMPT, 'MOBILE')
  console.log(`Screen id: ${screen.screenId}`)

  const htmlUrl = await screen.getHtml()
  const imageUrl = await screen.getImage()
  console.log('Fetched asset URLs')

  const htmlPath = path.join(htmlDir, `${SLUG}.html`)
  const imagePath = path.join(shotDir, `${SLUG}.png`)

  const [htmlBytes, imageBytes] = await Promise.all([
    download(htmlUrl, htmlPath),
    download(imageUrl, imagePath),
  ])

  await upsertManifest({
    slug: SLUG,
    id: screen.screenId,
    htmlPath: `stitch/html/${SLUG}.html`,
    htmlBytes,
    imagePath: `stitch/screenshots/${SLUG}.png`,
    imageBytes,
    designSystem: 'datebooth',
    station: 'self',
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: SLUG,
        screenId: screen.screenId,
        htmlPath: path.relative(root, htmlPath),
        imagePath: path.relative(root, imagePath),
        htmlBytes,
        imageBytes,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
