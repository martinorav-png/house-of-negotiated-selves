# Datebooth UI

React port of the Datebooth station screens (excluding intro), with Framer Motion transitions.

## Run

```bash
cd datebooth-ui
npm install
npm run dev
```

Opens at **http://localhost:5174**

## Flow

1. **About You** (Self)
2. **How You Love** (life vision / dealbreakers)
3. **Matches** - five persona portraits each ask a question
4. **Forging Your Companion** (auto-advances)
5. **Your Companion** (Reveal - uses locked match from station 3)

## Notes

- Companion portraits: source files in `../mock-ui/assets/char1.png` … `char5.png`, served from `public/assets/personas/persona-1.png` … `persona-5.png`
- The ambient scene on **About You** is rendered by a top-level `AmbientScene` layer in `App.tsx`, not baked into the screen component.
- Portrait mirror frame is pillarboxed on wide viewports.
