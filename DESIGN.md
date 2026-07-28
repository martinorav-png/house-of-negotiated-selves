---
name: House of Negotiated Selves — Mirror Terminal
description: Institutional capture interface for solo intake kiosk; warm Debra orb over cold phosphor instrumentation.
colors:
  void: "#08080a"
  surface: "#0f0f12"
  panel: "#141418"
  panel-raised: "#1a1a20"
  border: "#2a2a32"
  border-bright: "#3d3d48"
  text-primary: "#e8e6e1"
  text-secondary: "#9a97a8"
  text-muted: "#5c5968"
  phosphor: "#3dff8a"
  phosphor-dim: "#1a5c38"
  phosphor-glow: "rgba(61, 255, 138, 0.22)"
  amber: "#ffb347"
  amber-glow: "rgba(255, 179, 71, 0.35)"
  alert: "#ff4545"
  field-bg: "#0a0a0c"
typography:
  display:
    fontFamily: "Syne, system-ui, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "Fragment Mono, ui-monospace, monospace"
    fontWeight: 400
    letterSpacing: "0.02em"
rounded:
  sm: "2px"
  md: "4px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.phosphor-dim}"
    textColor: "{colors.phosphor}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  chip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
---

## Overview

**Institutional Mirror Terminal** — a clinical smart-mirror intake UI for the Ars Electronica installation *House of Negotiated Selves*. Charcoal void ground, phosphor-green instrumentation, amber reserved for Debra's orb only. No serif typefaces. Questions read as apparatus, not romance.

Visitor mode: **Operate** (complete solo intake task).

## Colors

| Role | Token | Usage |
|------|-------|-------|
| Void | `--void` | Page ground, entry/reveal full bleed |
| Surface | `--surface` | Main kiosk shell |
| Panel | `--panel` | Input fields, side rails |
| Phosphor | `--phosphor` | System logs, confidence, active states, primary actions |
| Amber | `--amber` | Debra orb glow only |
| Alert | `--alert` | Lie detector pulse, warnings |

High-contrast question fields: white (`#f4f2ed`) text on `--field-bg` for station prompts per journey PDF.

## Typography

- **Syne** — station labels, questions, display headings. Geometric, angular, no serif.
- **Archivo** — body UI, buttons, chips, descriptions. Industrial grotesk.
- **Fragment Mono** — system logs, IDs, confidence readout, metadata.

**Banned:** Instrument Serif, Playfair, Cormorant, Fraunces, any slop serif.

## Layout

Kiosk shell: 1440×900 reference, landscape-first; stacks below 1100px.

```
[ TopBar: station · visitor ID · confidence · close ]
[ Main 65% | Rail 35%: orb · Debra quote · log · silhouette ]
[ BottomNav: back · next ]
```

Entry/Reveal: centered or split full-bleed layouts (no StationShell rail).

**Stacked / narrow (≤1100px):** Debra coaching promotes into a sticky coach strip at the top of main; rail quote is hidden to avoid duplicate; silhouette yields so log + orb stay reachable. Short landscape heights hide silhouette first.

## Elevation & Depth

Flat matte panels with 1px borders. Depth via border brightness and phosphor glow on active elements, not cards or shadows. Scan-line overlay on shell (`::after`).

## Shapes

Sharp corners: 2–4px radius max. No pill buttons except where touch target requires (min 48px height). Rectangular chips.

## Components

- **StationShell** — shared station layout
- **ConfidenceMeter** — nixie-style segmented readout
- **SystemLog** — scrolling phosphor feed
- **PartnerSilhouette** — abstract figure, glitch intensity 0–3
- **LieDetector** — yes/no with pulse trace
- **DebraOrb** — glass orb with amber glow in dark context
- **ReflectiveCard** — ID capture, institutional ringlight frame

## Do's and Don'ts

**Do:** Escalate glitch on silhouette S1→S3. Accumulate system logs. Show confidence from Station 1. Keep Debra coaching visible (rail on wide; sticky coach strip on stacked). Use phosphor for machine voice.

**Don't:** Blush/coral palette. Dating-app hearts/swipes. Serif prompts. Glassmorphism decoration. Gradient text. Rounded SaaS cards. Thick colored side-tab borders on cards.
