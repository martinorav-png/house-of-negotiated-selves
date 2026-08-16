# Debra introduction design

## Outcome

Station II consistently names the AI companion guide **Debra**. When Debra's orb first appears, the explanatory sentence is attached directly beneath the orb and name at a larger, more legible size. It remains attached through the short “Let's get started” phase, then disappears when binary questions begin.

## Naming

- Replace visible `DEBORA` and accessible `Debora, companion guide` text with `DEBRA` and `Debra, companion guide`.
- Rename the React component, CSS selectors, local variables, and journey phase from `Debora`/`debora` to `Debra`/`debra` so implementation terminology matches the visitor-facing name.
- Preserve all unrelated Debra orb behavior, motion, and positioning.

## Layout and typography

- Move “I will help you describe the companion you believe you want.” out of the lower `.journey-debora-copy` block.
- Render the sentence inside the Debra guide wrapper, directly beneath the `DEBRA` name.
- Use centered, high-contrast white text at `18px`, approximately `1.35` line height, and a maximum width of `24ch`.
- Expand the guide wrapper enough to prevent the sentence from clipping while keeping the orb itself at its current `150px` size.
- Show the sentence during `companion-intro` and `debra-brief`; hide it during questions, height selection, completion, and any phase before the orb appears.
- Keep “Let's get started.” in its existing lower content position, now without duplicate explanatory copy.

## Accessibility

The guide wrapper continues to expose one concise accessible label for Debra. The explanatory sentence remains real DOM text and is announced once. No duplicate hidden copy is added.

## Verification

Runtime tests cover the complete rename, the explanation's first appearance, its persistence through the Debra briefing, and its removal when questions begin. Portrait browser QA checks that the expanded text does not overlap the lower title or station header. The full test suite and production build provide regression coverage.
