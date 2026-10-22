# Validation — 2026-10-10

Version 0.1.0, Windows, Python 3.12, bundled Playwright 1.62.1 Chromium, PptxGenJS 4.0.1.

- Python bundler: 3 tests passed (embedding/Chinese, marker validation, unresolved asset rejection).
- Browser runtime: 9 scenario groups passed: navigation; editing/focus/drafts; presenter synchronization/notes/font/timer; clean-browser export/reopen/edit; Markdown notes; source-versus-stale-draft conflicts; reorder/notes; reduced motion/phone stage; blocked popup recovery.
- Export regression: PDF created; PPTX verified for native text, a native rectangle, and per-slide notes; intentionally clipped text correctly fails QA.
- Sample deck: 3 slides / 3 notes, geometry and offline checks passed. All three HTML screenshots visually inspected. PDF page count verified as 3. PPTX opened in local Microsoft PowerPoint and all three slides rendered; first two inspected for text/layout, with a padding correction followed by another native PowerPoint render and inspection.
- Root and generated plugin SKILL.md passed skill-creator quick_validate; package parity passed.

These checks cover the sample and shared mechanisms, not the visual quality of all future decks. Actual Claude Code plugin installation, other browsers/operating systems, projector hardware and all upstream templates have not been exercised. Third-party fonts/media need their own license and rendering checks. PPTX keeps complex visuals rasterized and does not reproduce browser animation/interactivity.

## Independent forward test

A separate agent used the skill to create a four-page Chinese staff-training deck from a new brief, with an explicit white/navy/orange direction. It produced offline HTML, current Markdown notes and a four-page PDF. It inspected representative pages before expansion and all final screenshots/PDF pages. Keyboard/presenter/timer/edit-export-reopen/draft-conflict/reorder checks passed, and PDF text inspection found no speaker-note leakage. No blocking workflow ambiguity was reported. The agent used existing dependencies and made no changes to skill source. This is one realistic generation test, not evidence of universal design quality.
