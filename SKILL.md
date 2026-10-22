---
name: ppt-studio
description: Create, improve or convert HTML presentations from a topic, source materials or an existing PPTX. Combine visual style exploration with speaker notes, a presenter window, offline editing and export. Use for slide decks, PPT, talks, teaching and reports; research is only added when the user requests it or the task requires it.
---

# PPT Studio

Create presentations using Frontend Slides design resources and the bundled PPT Studio runtime. HTML is the primary deliverable; include notes and a static PDF backup when tools permit. Produce an editable PPTX when requested. Preserve the user's language, facts, references and explicit choices.

## Start from the request

- **New deck:** use the topic, notes or supplied materials to organize the slides.
- **Existing HTML:** inspect the file and its actual rendering first. Keep working content and style; update only what the task needs.
- **Existing PPTX:** run `scripts/extract-pptx.py` when python-pptx is available. Preserve required text, images, order and notes. Read charts/tables visually as well: text extraction alone is not a complete audit. Conversion does not guarantee editable charts or animation preservation.

Infer what is already known. Ask together only for missing details that change the deck: audience/purpose, duration or length, speaking versus reading, and required outputs. Accept mixed density and explicit high-density speaking decks; use hierarchy and notes rather than forcing a fixed bullet quota. Avoid repeating questions answered by the materials.

Organize and refine content as needed. There is no mandatory web-research or code-audit phase. Do additional investigation only when relevant to the user's task. Do not invent metrics, references, demonstrated features or results. Keep uncertainty explicit. A demonstration, a test result and real-world effectiveness are different kinds of evidence.

Keep a lightweight outline mapping required content and assets to each slide's stable ID, main point and notes. When preserving a manuscript, keep the required original text in the requested order in the notes. Split screen text from spoken explanation. Draft notes and timings together with the slides; do not treat notes as an afterthought.

## Choose the visual direction

Reuse all three visual sources below; none is limited to the starter example:

| Source | Included resources | How to reuse |
|---|---|---|
| Basic styles | All 12 presets in [STYLE_PRESETS.md](STYLE_PRESETS.md), including Paper & Ink, Swiss Modern and Neon Cyber | Apply the chosen palette, typography and signature elements to the user's content. |
| Design templates | All 34 indexed templates in [bold-template-pack](bold-template-pack/selection-index.json), including BlockFrame, Cobalt Grid and Signal | Shortlist from the index, inspect preview cards, then use the selected full design document. |
| Free design | A new visual direction based on the brief, content and references | Create a real-content sample, then reuse its design rules throughout the deck; no existing template is required. |

The included counts describe the current library, not a cap on future additions. When the user asks to browse more styles or see the full catalog, show the available names and short descriptions from these resources and offer another relevant preview batch. Do not restrict later choices to the first three samples.

Honor an explicit template or reference. For an existing approved deck, continue its design without reopening style selection unless asked.

With no settled direction, read [STYLE_PRESETS.md](STYLE_PRESETS.md) and the compact [template index](bold-template-pack/selection-index.json). Offer three genuinely different previews by default: a restrained option, a suitable bold template and a freely designed option. Adjust the count to the user's request. Read only shortlisted `preview.md` files, then the selected `design.md`; avoid loading all templates.

Use real deck content in the previews. Show a title and a representative content layout so the user can judge density and Chinese typography. Internal labels such as template names, preview, metadata or filenames belong outside the slides. Match the occasion rather than treating any style as the universal default.

After selection, retain the reference screenshots and record its palette, typography/weights, title treatment, spacing, border/shadow language and motion rhythm. Expand this system across the deck. Do not silently change title strips, backgrounds or font weights. Recheck representative pages against the selected reference after revisions. Read [design-and-qa.md](references/design-and-qa.md) for the experience-based checks.

All three sources use the same PPT Studio playback, presenter, notes, editing and export capabilities. Reuse the selected visual system while adapting its markup to the runtime contract; never let the shared starter's appearance overwrite the selected style or import a second player from a template.

## Build and integrate

Read [html-template.md](html-template.md) for the markup contract and [runtime.md](references/runtime.md) for authoring and editing. Adapt [examples/starter.html](examples/starter.html); its appearance is an example, not a default theme.

- Use a fixed 1920×1080 stage scaled as a whole to the viewport, including phones.
- Use one unique deck ID, stable semantic slide IDs and stable editable-field IDs. Each slide contains exactly one `template[data-notes]`. Do not use slide indexes as persistent IDs.
- Use the supplied runtime once. Do not add a competing SlidePresentation controller, editor or presenter implementation from template examples.
- Author a distinct visual system from the selected reference. Use readable CJK fonts. Embedded licensed fonts are preferable for portable typography; a tested system-font fallback is acceptable. Do not leave network font dependencies in an offline deliverable.
- Use figures, screenshots, diagrams and tables when they clarify the material. Preserve editable diagram sources when provided/generated. Keep captions and semantic labels concise; color alone should not carry meaning.
- Read [animation-patterns.md](animation-patterns.md) for suitable visual effects. Animate reading order and meaningful processes. Keep layout transforms on the stage and effects on child elements. Support reduced motion and final static states. Avoid repeating attention-seeking motion.
- Complete a few representative pages and inspect them before extending the full deck. This is agent self-review, not an extra approval gate.

Bundle the final single-file HTML with `python scripts/bundle.py source.html output.html`. Embed images, styles and licensed fonts first. The bundler refuses unresolved resource references; it does not download or license third-party assets for you. Keep authoring source separate from output. Never treat an HTML file with remote assets as offline-ready.

## Verify and revise

Follow [design-and-qa.md](references/design-and-qa.md). With Playwright available, run:

```sh
node scripts/check-deck.cjs output.html work/qa --pdf
```

Inspect every new slide's screenshot; on a local revision inspect affected slides and adjacent pages. Automated geometry checks do not establish visual quality. Check reading order, density, screenshot legibility, diagrams, font rendering, spacing and style fidelity. Test keyboard navigation, rapid switching, presenter synchronization, notes, timer, editing and export/reopen. Do not say an unrun check passed.

When a user edits a delivered HTML, treat that file as the current source. Read its live text and notes; do not regenerate from an older source and erase changes. Convert it back to authoring form only when necessary, preserving edits and IDs. When changing content, synchronize notes, diagrams, screenshots and required output formats. Regenerate the QA report for the changed version.

## Deliver

Provide the offline HTML, Markdown notes (the runtime exports these), static PDF and any requested editable source files. Read [export.md](references/export.md) for PDF/PPTX and limits. For PPTX, native text/basic annotated rectangles and rasterized complex visuals are supported; do not claim browser interaction or animation equivalence.

Give a short handoff: files, actual checks, material limitations, and keys (arrows/Space, F fullscreen, N presenter, E edit, Escape finish editing, Ctrl/Cmd+S save HTML). Local browser drafts are not a portable file; exported HTML carries the edits. Keep notes in the presenter window, not the audience view.

Publishing, deployment and external sharing require a user request. Do not automatically deploy or turn ordinary delivery into a sharing questionnaire.
