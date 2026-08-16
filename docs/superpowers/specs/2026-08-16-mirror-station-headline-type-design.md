# Shared Station III headline treatment

## Outcome

The large prompts and titles in Stations I and II use the same uppercase Helvetica-style glyphs and animated grain/smudge rendering as the large canvas headlines in Station III. Small status text, input values, buttons, helper copy, and footer text remain crisp.

## Visual treatment

- Reuse Station III's `MirrorHeadline` rendering path and live text settings rather than approximating the effect in CSS.
- Preserve the current Station I/II font sizes, content positions, black field, white hierarchy, and pale-blue tracking accents.
- Render titles in uppercase with the Station III weight, grain, smudge, and fade-in behavior.
- Split long prompts into deliberate lines so the canvas treatment does not shrink them into an unreadably small single line.

## Semantics and interaction

Each textured headline retains real DOM text for accessible naming and automated interaction tests. The canvas is decorative and hidden from assistive technology, preventing duplicate announcements. Intake labels continue to label their existing inputs; only their visible title layer changes.

## Scope

The treatment applies to:

- Station I name and age prompts, analysis messages, self-reflection question, calculating title, and completion title.
- Station II percentile and matching messages, Debora's main title, binary questions, height title, and completion title.

It does not apply to typed names or ages, explanatory body copy, button labels, recording/station indicators, camera fallback copy, or footer text.

## Verification

Component tests verify that a textured canvas and semantic text are both present for the new shared headline component. Existing journey runtime tests continue to validate visible wording and phase progression. Browser QA checks representative short and long prompts at the portrait ratio, and the full test suite and production build provide regression coverage.
