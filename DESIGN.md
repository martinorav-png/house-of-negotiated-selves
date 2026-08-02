---
name: House of Negotiated Selves - Datebooth
description: Dark boutique matching UI; soft pink romance chrome over charcoal void; Debra as Companion Guide in a dream-partner vitrine.
colors:
  void: "#0D0D0D"
  surface: "#121212"
  panel: "#1A1A1A"
  text-primary: "#F5F5F5"
  text-secondary: "#C8C4C0"
  text-muted: "#7A7570"
  rose: "#F5B8C4"
  rose-bright: "#FFC9D4"
  rose-deep: "#2A151C"
  ink-on-rose: "#0D0D0D"
  line: "#F5B8C4"
  glow: "rgba(245, 184, 196, 0.45)"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontWeight: 500
    letterSpacing: "0.14em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontWeight: 400
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontWeight: 600
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "8px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.ink-on-rose}"
    rounded: "{rounded.sm}"
    padding: "18px 28px"
  tag:
    backgroundColor: "{colors.rose}"
    textColor: "{colors.ink-on-rose}"
    rounded: "{rounded.sm}"
---

# Datebooth

## Overview

**Datebooth** is the visual system for the *House of Negotiated Selves* mirror intake. It sells the journey as finding your **perfect AI companion / partner**: dark boutique vitrine, soft rose accents, thin ornamental lines, and an uncanny retail calm.

Canonical first screen (locked): centered portrait intro with title **YOUR PERFECT COMPANION**, installation name **HOUSE OF NEGOTIATED SELVES**, Debra as Companion Guide copy, silhouette + **AVAILABLE TONIGHT** price tag, and **BEGIN VIEWING** CTA.

Visitor mode: **Operate** (solo matching journey).

Emotional register: romance language + shop-window certainty. Warm pink on cold charcoal. Love, slightly wrong.

## Product framing

- Goal: find the visitor’s AI companion / perfect partner.
- **Debra** is the **Companion Guide** (and the companion presence on Entry). Debra is **not** the user.
- Entry is introductory only: no visitor name, DOB, ID photo, or profile fields.
- Later stations collect self / desire / match data; keep the same Datebooth chrome.
- Copy is SFW, gallery-safe. No em dashes in UI copy.

## Entry lock (from approved screen)

1. Top ornament: thin horizontal rules meeting a circled line-heart  
2. Display title: `YOUR PERFECT COMPANION` (rose, serif, tracked caps)  
3. Diamond hairline divider  
4. `HOUSE OF NEGOTIATED SELVES` in white sans, flanked by small solid rose hearts  
5. Body: “Step inside and meet **Debra**, your **Companion Guide**. She’ll help you select the AI partner meant for you.” (`Debra` + `Companion Guide` in rose)  
6. Center: faceless Debra silhouette with soft rose outline glow on a low circular pedestal; hanging rose **AVAILABLE TONIGHT** price tag (dot + diamond + heart marks)  
7. Hairline + center diamond behind the pedestal  
8. Primary CTA: rose panel with heart-key icon + `BEGIN VIEWING`  
9. Footer: three small diamonds (center emphasized)

## Colors

| Role | Token | Approx | Usage |
|------|-------|--------|-------|
| Void | `--void` | `#0D0D0D` | Full-bleed ground (fine grain allowed, very subtle) |
| Surface | `--surface` | `#121212` | Shell / secondary fields |
| Rose | `--rose` | `#F5B8C4` | Titles accent, tag fill, CTA, ornaments |
| Rose bright | `--rose-bright` | `#FFC9D4` | Emphasized inline names, silhouette rim |
| Text | `--text-primary` | `#F5F5F5` | Body, installation name |
| Ink on rose | `--ink-on-rose` | `#0D0D0D` | Type on pink buttons/tags |
| Glow | `--glow` | rose @ ~45% | Soft silhouette outline only |

Color strategy: **Restrained** - charcoal void + one romance accent. No phosphor green, no amber orb language, no purple cyberpunk neon, no Soft Future coral wash.

## Typography

- **Display (titles):** Cormorant Garamond (or matched light elegant serif). All-caps, generous tracking. Rose on void for hero titles.
- **Body / UI:** Manrope. Light weight for intro copy; semibold tracked caps for button and tag labels.
- **Emphasis in body:** same sans family, rose color for `Debra` and `Companion Guide` only.

Do not switch Entry’s hero title to a geometric sans; the serif is part of the Datebooth identity.

## Layout

Primary canvas: **portrait 9:16** (production 24″ mirror; comps ~1080×1920).

Entry composition (centered stack):

```
[ line-heart ornament ]
[ YOUR PERFECT COMPANION ]
[ diamond divider ]
[ ♥ HOUSE OF NEGOTIATED SELVES ♥ ]
[ intro paragraph ]
[ silhouette + AVAILABLE TONIGHT tag ]
[ BEGIN VIEWING ]
[ diamond footer ]
```

Station screens should keep:

- same void + rose system
- same thin diamond/heart ornaments sparingly
- one primary vitrine/content block
- Debra coaching as a caption line (rose emphasis on her name)
- one large rose CTA
- no landscape side-rail shell from the old Institutional Terminal

Landscape browser: pillarbox the portrait frame; do not redesign as a wide dashboard.

## Elevation & depth

Mostly flat. Allowed depth:

- 1px rose hairlines and diamond junctions
- soft outer glow on Debra silhouette only
- price-tag hanging from a single vertical thread

No heavy shadows, no glassmorphism stacks, no scanlines, no skeuomorphic metal.

## Shapes & icons

- CTA: rounded rectangle (~4–8px), full-width comfortable touch height
- Tag: rectangular price-tag with notched/threaded top
- Ornaments: circle-heart, solid mini hearts, center diamonds, hairline rules
- CTA icon: heart-shaped key (line or solid, matching weight of ornaments)
- Pedestal: low concentric ellipse/rings under silhouette

Avoid: pill clusters, swipe cards, emoji spam beyond the two small hearts flanking the installation name, orb mascots.

## Components

- **DateboothOrnament** - circled heart + hairlines; diamond dividers; footer diamonds
- **DisplayTitle** - serif tracked caps in rose
- **InstallationLabel** - sans caps with flanking hearts
- **DebraLine** - body copy with rose name emphasis
- **CompanionSilhouette** - faceless figure + rose rim glow + pedestal (Entry shows Debra; later screens can densify a partner silhouette)
- **NightTag** - `AVAILABLE TONIGHT` / `RESERVED FOR YOU` / `MATCHED`
- **HeartKeyCTA** - rose primary button
- **TraitChips / MeasureBar / BlankForm / YesNoPads** - station controls in the same flat rose/charcoal language

## Screen map

| Screen | Job | Continuity |
|--------|-----|------------|
| Entry | Intro; meet Debra | Locked composition above |
| Self | Learn the visitor | Same chrome; questions in a dark plate; tag may stay AVAILABLE TONIGHT |
| Desire | Dream partner prefs | Chips + measure; silhouette becomes more “product-like” |
| Matches | Life vision / dealbreaker / yes-no | Intimate copy; still boutique, not clinical phosphor |
| Generating | Forge companion | Tag → RESERVED FOR YOU; silhouette fills |
| Reveal | Present match | Tag → MATCHED; chamber invite CTA |

## Motion

1. Soft silhouette rim breathe (very subtle; kill under reduced motion)  
2. Tag state swap on station complete  
3. CTA press as flat opacity/scale, not neon flash  

## Do’s

- Keep Debra as Companion Guide, never as the visitor’s identity form
- Keep Entry free of personal data fields
- Keep rose reserved for romance chrome, emphasis, and primary actions
- Keep ornaments thin and sparse so the layout stays boutique, not scrapbook
- Let uncanny come from retail certainty (`AVAILABLE TONIGHT`) plus companion language

## Don’ts

- Don’t revive Institutional Mirror Terminal (phosphor / amber orb / scanlines / landscape rail)
- Don’t make Debra a glass orb or a photoreal face
- Don’t turn hearts into dating-app like/swipe chrome
- Don’t add purple neon cyberpunk or busy HUD overlays
- Don’t show physical kiosk/room photos in UI comps; full-bleed digital screen only
- Don’t start the flow with a passport dump on Entry
