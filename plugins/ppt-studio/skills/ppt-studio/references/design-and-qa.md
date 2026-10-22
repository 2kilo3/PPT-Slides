# Design and delivery checks

These checks generalize the user's two presentation iterations; BlockFrame, a six-minute duration and hackathon content are examples, not defaults.

## Before expanding a deck

Compare a title page, dense content page and figure/screenshot page with the chosen reference. Record actual palette, title treatment, font weights, border/shadow and spacing. A style name alone is not enough. Use the full selected design document, not only its preview card.

For Chinese text inspect real glyphs and line breaks. High density needs a clear headline, primary evidence and secondary explanation. Do not solve density by making all text small. Keep full spoken explanations in notes when appropriate. User-specified density takes precedence over a preset's suggested bullet count.

Use diagrams to express actual relationships. Name node roles and arrow meanings, use short captions, and distinguish meanings with labels as well as color. Choose diagram colors from the deck palette. Retain editable diagram sources and synchronize them when changes affect the figure.

Motion should reinforce reading order. Prefer a brief page transition, grouped entry and occasional emphasis. Keep already-explained content stable. Test rapid next/back, reduced motion and static export. Never put stage scaling and entrance animation on the same transform.

## Automated and visual checks

Run `scripts/check-deck.cjs` on trusted authored decks. It launches Chromium with network requests blocked, captures each page, checks required runtime metadata, notes, visible slide count, annotated text/container bounds, missing images, browser errors and mobile stage ratio. It can produce PDF and PPTX after those checks pass. Playwright is a development/export dependency; the delivered HTML needs only a browser.

Inspect the PNGs at real reading size. The script cannot judge hierarchy, overlapping unannotated panels, truthfulness, meaning, colors or font suitability. Mark result wording accordingly. For a new deck inspect all pages; for modifications inspect changed pages and neighbors.

Behavioral checks: keyboard bounds, rapid switching, focus inside text editing, presenter next/back from both windows, notes after page changes, timer pause/reset, popup recovery, editing then export, reopening in a clean browser and editing again. Reordering must preserve notes, and stale browser drafts must not overwrite revised source. Repository runtime tests cover these mechanisms; generated deck content still needs its own check.

For a content update, identify affected slides first. Synchronize claims, screenshots, diagrams, notes, timings and export formats. Preserve the agreed design. Distinguish source/code evidence, synthetic demonstrations, tests and measured field results. Avoid unsupported claims of accuracy or original authorship.

## Delivery evidence

Retain the source file, reference sample, output, screenshot set and QA report in appropriate task folders. Explain exactly which checks ran and which need actual PowerPoint or presentation-device verification. Do not call a structural test an aesthetic pass or a browser test a projector acceptance test.
