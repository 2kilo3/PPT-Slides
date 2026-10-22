# Runtime and editing

PPT Studio runtime is newly implemented for this project. It does not include code from personal-homepage-skill.

## Audience and presenter

Arrows, Space, PageUp/PageDown, Home/End navigate. Swipe and wheel navigation are supported. F requests fullscreen, N opens a separate presenter window, E toggles text editing, Escape ends editing, Ctrl/Cmd+S downloads the current HTML. Form fields, buttons, links and editable text do not trigger slide navigation.

The presenter shows a non-interactive current-slide preview, next title, editable notes, adjustable notes font and start/pause/reset timer. Navigation works in either window. If popups are blocked, allow popups and retry N. Notes are never automatically revealed in the audience view as a fallback. The presenter requires its audience window to remain open.

## Save behavior

The page DOM contains current text and notes. Browser localStorage keeps a draft scoped to the deck ID. A saved draft applies only when its original value still matches the file; changed source wins over conflicting old drafts. The toolbar reports unavailable storage and stale conflicts. Export a file to carry edits between devices.

HTML export serializes current text/notes, removes temporary editing/UI state and starts on the first slide. It embeds the same runtime for another editing session. Markdown notes export reads current slide order and notes, including browser edits. No edits are sent to a service.

When AI revises an exported file, its text and notes are authoritative. Preserve them when rebuilding. The runtime has no automatic merge with a separate authoring source. Keep copies of user-edited files before a structural revision.

## Developer interface

`window.PPTStudio.go(index)`, `.index`, `.count`, `.openPresenter()`, `.exportHTML()`, `.exportNotes()` and `.snapshot()` are available to browser checks. `.snapshot()` returns portable HTML without starting a download. The runtime requires the documented markup and intentionally fails on ambiguous IDs or missing notes.

The runtime provides presentation mechanics, not a full drag-and-drop editor. Complex layout changes stay with the authoring agent.
