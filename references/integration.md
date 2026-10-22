# Integration scope, v0.1

| Area | Approach | Status |
|---|---|---|
| Content discovery, presets, template library | Retain MIT Frontend Slides resources; adapt entrypoint to honor settled choices | Implemented |
| Style consistency | Keep selected samples and explicit palette/type/layout rules; compare revisions | Skill instructions |
| Chinese density and diagrams | Real-content samples, readable type, semantic captions and source retention | Skill instructions; per-deck visual QA |
| Playback and motion | One fixed-stage runtime, focus-safe keys/swipe/wheel, reduced motion | Implemented |
| Presenter and notes | New runtime: current preview, next title, two-way navigation, notes editing, font and timer | Implemented |
| Editing and portability | New plain-text editor, draft conflict checks, HTML/Markdown export | Implemented |
| Screenshot and file checks | Playwright capture, geometry/resource errors, PDF and mixed PPTX | Implemented; visual inspection still required |
| PPTX fidelity | Native annotated text/rectangles, raster complex visuals, speaker notes | Initial adapter; PowerPoint rendering must be checked |
| Broad host support | File-based skill plus generated Claude plugin package | Package validated; individual host installation not yet verified |

Experience-derived changes: selected styles cannot drift silently; dense pages need hierarchy; figures share palette and concise labels; motion follows reading order; updates synchronize slides/notes/figures; export/reopen is a first-class check. None of these impose a fixed hackathon story or BlockFrame aesthetic.

Out of scope for this version: personal homepages, cloud accounts, drag-and-drop layout editor, collaboration server, automatic publishing, mandatory topical research. Tests and example content are original and do not contain the user's old project data or chat transcripts.
