# Export and portability

## HTML and notes

Bundle with `python scripts/bundle.py source.html deck.html`. The Python standard-library tool embeds the shared CSS/JS and rejects unresolved resource references. Embed licensed fonts/images or explicitly provide and verify a resource folder separately. The bundler is a strict single-file path, not an asset downloader. Use the browser's Export Notes button or `PPTStudio.exportNotes()` for the current Markdown script.

## PDF and PPTX

Install development dependencies with `npm install` and the Chromium browser with `npx playwright install chromium`, or use an already available compatible runtime. Do not install dependencies into an unrelated project. Run:

```sh
node scripts/check-deck.cjs deck.html work/qa --pdf --pptx
```

`--pdf` prints one slide per page using the print rules. `--pptx` uses PptxGenJS: elements marked `data-edit-id` become native text, `data-pptx-shape` rectangles become native shapes, and complex visuals remain a raster backdrop. Include editable annotations on every primary text item that must remain editable. It also transfers the notes. Keep shape and text annotations as siblings, not nested duplicated exports.

This is a practical mixed export, not a universal HTML/CSS-to-PowerPoint converter. Native text uses browser geometry and font selection, so PowerPoint font substitution, line spacing and wrapping can differ. Complex rotations, gradients, rich inline typography, charts and interactive components are not reconstructed as native objects. HTML animations and presenter/editing controls do not transfer. Backgrounds are rasterized at the screenshot resolution (1280×720).

Verify the PPTX in PowerPoint or a compatible renderer when available; otherwise report that native rendering is unverified. Do not claim screenshot-perfect or fully editable output. For higher-fidelity native charts or layouts, rebuild those requested pages with available presentation tools and recheck.

The upstream `scripts/export-pdf.sh` remains as a legacy path; this project's Node checker is the cross-platform default and does not automatically download dependencies. `scripts/extract-pptx.py` remains the inbound PPTX extractor and requires python-pptx. Unsupported source objects need visual inspection rather than silent omission.

Public hosting and uploads are separate user requests. Offline files and local exports do not require deployment.
