# House of Negotiated Selves — Full Context

Ars Electronica 2026 · Theme: **Future Begins – Negotiating Humanity**  
Festival starts: **9 September 2026**  
Package / repo name: `house-of-negotiated-selves`

This file is the handoff doc so another machine (or agent) can continue without chat history.

---

## Concept

Interactive solo installation about the line between human autonomy and machine representation, framed as a funhouse mirror. The visitor is reflected accurately at first, then the system gradually distorts, predicts, and misrepresents them. The question: when does reflection become substitution, and when does a machine start speaking *for* someone?

**Core principle:** Debra (AI guide) is warm and sycophantic so visitors share freely. Extraction feels safe. The “forced” quality is revealed **retroactively** when the system keeps using what was given and stops asking permission.

**Current digital mock framing (Soft Future Companion):** the intake builds a **partner / companion**, not a “new self.”  
- **Self** = who the visitor is  
- **Desire** = what they want in a partner  
- **Matches** = candidate partners ask questions  
- **Generating / Reveal** = the **companion** is forged and shown  

---

## Physical layout (locked)

- Room: **8.6 × 4.8 × 2.8 m**, darkened, solo visitors  
- Corridor with **three right turns**, LED floor guides → **hexagonal final room** (mirrored walls + screen)  
- Exit curtained near entry (“end of the loop”)  
- Latex curtains + red/green lighting between stages  
- Aesthetic: **factory/clinical** physical space (muted, matte, latex). Digital UI currently uses Soft Future blush/coral (*Her*-adjacent), which can diverge from physical finish.  

---

## Station journey

| Stage | Role |
|--------|------|
| Entry / lobby | Debra greets; orchestrator (human+AI) behind the scenes |
| Station 1 — Self | Keyboard/tablet survey, unsettling random Q, ringlight ID photo, hesitation logging, ~1 min voice sample |
| Station 2 — Desire | Partner preferences; questions get stranger; avatar/companion gen starts in background |
| Station 3 — Matches | Template persona PFPs ask questions via thought bubbles; answers weight traits for the companion |
| Final hexagon | Screen avatar (Unity stretch); voice stranger→visitor clone; confidence HUD; false memory; assertion; gentle leave pushback |
| Exit | Photocard × dating-profile keepsake + QR data receipt (EU AI Act disclosure) |

**Characters**

- **Debra:** non-human **orb** (not a face). Pre-recorded ElevenLabs voice (v3 emotion tags). Not live TTS.  
- **Final companion avatar:** live TTS (Flash); only live voice in the piece.  
- **Orchestrator:** hidden human (+ AI), can be glimpsed behind a curtain.  

---

## What’s in this repo

```
ars-electronica/
├── CONTEXT.md                 ← this file
├── package.json               ← root scripts (mock, samples)
├── .env.example               ← ELEVENLABS_API_KEY only
├── scripts/
│   ├── debra-intro.txt        ← canonical Debra entry monologue
│   ├── generate-debra-samples.mjs
│   ├── create-env.sh
│   └── slack-debra-vote-draft.md
└── mock-ui/                   ← Vite + React kiosk mock (Soft Future Companion)
    ├── src/                   ← screens + ReflectiveCard + DebraOrb
    ├── public/stitch/         ← orb + match assets from Stitch
    ├── stitch/                ← downloaded Stitch HTML + screenshots
    └── README.md
```

**Not committed (and should stay out):** `.env`, `node_modules/`, `samples/*.mp3`, `mock-ui/dist/`

---

## Mock UI (current digital flow)

Clickable landscape kiosk prototype.

**Flow:** Welcome → 01 Self → 02 Desire → 03 Matches → 04 Generating → 05 Reveal  

**Run on a new machine:**

```bash
git clone <this-repo-url>
cd ars-electronica   # or repo folder name
cp .env.example .env # add ElevenLabs key only if generating Debra samples
cd mock-ui && npm install && cd ..
npm run mock
```

Open the Vite URL (usually `http://127.0.0.1:5173`).  
For the ID ringlight camera: use **Chrome/Safari** on localhost, click **Enable camera** on Station 01 (browser needs a user gesture). Cursor’s embedded preview often cannot access the webcam.

**Design tokens (Soft Future):**

- Background `#fef8f4`, primary `#a43a3d`, coral containers `#ff7f7f`  
- Type in **code:** Instrument Serif (prompts) · Bricolage Grotesque · Space Mono  
- Type in **Figma export:** **Syne** (sans display, replaced serif) · Bricolage · Space Mono  
- Debra: glass orb image `mock-ui/public/stitch/debra-orb.jpg`  
- Station 01 ID panel: `ReflectiveCard` (webcam + metallic glass effect, `lucide-react`)

**Partner framing copy examples:** “Forging your match…”, “Your Companion”, match PFPs asking questions.

---

## Stitch project

- Title: **Soft Future Companion Intake**  
- ID: `695494198560560923`  
- Screens were pulled via `@google/stitch-sdk` (`getHtml` / `getImage`) into `mock-ui/stitch/`  
- Runtime copies under `mock-ui/public/stitch/`  
- Design-system asset stub ID did not fetch via `get_screen`; tokens taken from screen HTML  

Stitch MCP (optional): Cursor `~/.cursor/mcp.json` may contain `stitch.googleapis.com/mcp` with an API key. Do not commit that key.

---

## Figma

- Connected account: Martin Orav  
- Soft Future screens pushed to:  
  **https://www.figma.com/design/7Aas74MjjERLHKuc9blj8y**  
  File name: Soft Future Companion Intake  
- Screens: 00 Welcome … 05 Reveal (1440×900), Syne instead of serif  
- Created under Martin Orav’s team drafts (also has EKA digitoode + Avail plans)  

---

## Voice / Debra samples

```bash
cp .env.example .env
# set ELEVENLABS_API_KEY=
npm run env:create   # optional helper
npm run samples:debra
```

- Debra: **pre-recorded**, model `eleven_v3` for `[happy]`, `[chuckles]`, `[thoughtful]`  
- Canonical intro: `scripts/debra-intro.txt`  
- Voice candidate historically narrowed toward Hope / vote drafts; re-check `samples/` locally (gitignored)  

---

## Intended production stack (not built in this repo yet)

- Hub: Mac Mini orchestration  
- Clients: Raspberry Pi + displays, two-way mirrors  
- Voice nodes: ESP-VoCat  
- Avatar pipeline: 2D A-pose prompt → Meshy/Tripo image-to-3D → Unity screen  
- Lighting: Hue or LIFX + PIR; Node / Node-RED  
- No live face biometrics; no live scraping of visitors  
- EU AI Act disclosure folded into QR data receipt  

**Avatar prompt constraints:** full body, A-pose, plain background, stylized/low-poly, muted clinical palette, not photoreal.

---

## Locked decisions

- No hologram → screen + Unity  
- Keyboard/tablet at stations 1–2  
- Factory/clinical **physical** aesthetic  
- Debra = orb, not human face  
- One live companion avatar per visitor + template matches at station 3  
- Pre-generated fallback avatar library required  

## Still open

- 18+ vs SFW  
- Exact display sizes (7″ vs 21–24″)  
- Hexagon exit door vs retrace  
- Secondary senses (scent, temp, pulse)  
- Aligning physical factory look with Soft Future digital blush UI  

---

## Team (from planning)

Paula, Tõnis (Bender), Carina, Johannes Martin, Hendra, Sara, Anett, Martin (digital/technical), collaborator “Bob”. Weekly Mondays.

External planning: EKA board PDF/PNG in Documents; Notion page may exist under “House of Negotiated Selves”.

---

## Agent / tooling notes

- Cursor skills used: Refero design skill, ui-design-brain, Figma MCP (`plugin-figma-figma`)  
- Prompt rule used recently: **never use em dashes in UI copy** when generating designs  
- Git: do not commit `.env` or API keys from `~/.cursor/mcp.json`  

---

## Quick checklist on a new PC

1. Clone repo, `cd` into it  
2. `cd mock-ui && npm install`  
3. `npm run mock` from repo root  
4. Open localhost in Chrome/Safari  
5. Optional: copy `.env.example` → `.env` for Debra sample generation  
6. Optional: open Figma file linked above for visual source of truth  

**Bottom line:** This repo is Debra voice tooling + a full Soft Future Companion **kiosk mock** of survey → partner matches → companion reveal. Physical install + Unity + Meshy are designed but not implemented here yet.
