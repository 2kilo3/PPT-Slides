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

Use a fresh output directory for extraction and exports: generated filenames may replace existing output files. The legacy shell exporter installs Playwright and Chromium in a temporary directory, may load the deck's remote fonts/resources, and requires an authorized network-enabled setup. Its temporary asset server binds only to loopback and rejects paths or symlinks outside the presentation directory. Neither exporter is a sandbox for hostile HTML; render only decks you trust. The Node checker blocks HTTP(S) resource requests for offline QA, not every possible browser network channel.

Public hosting and uploads are separate user requests. Offline files and local exports do not require deployment.

## Optional Vercel publication

Only when the user requests publication, run:

```sh
bash scripts/deploy.sh deck.html --publish
# Add --prod only when a production deployment is explicitly requested:
bash scripts/deploy.sh reviewed-output/ --publish --prod
```

This helper needs Bash, Python 3.9+ and an already installed Vercel CLI on PATH. It does not install packages or start login. Run `vercel login` separately if needed, using the user's authorized account. Vercel keeps its normal project prompts; `--publish` records publication intent and the default target is preview. Preview URLs can expose the uploaded content according to the account's hosting settings, so review the actual files before uploading.

A single HTML input must have embedded resources, as produced by the bundler; the helper does not follow local references or copy adjacent folders. For local assets, prepare a dedicated static output directory containing `index.html` and all intended public assets. The entire directory is staged: inspect its contents, avoid personal files, and verify the deck locally first. Hidden entries, symbolic links/junctions, and build/deployment configuration files are rejected. Use a clean publication copy instead of a source repository; do not remove protected files from the source just to pass these checks.

Each run uses a fresh temporary root. CLI state stays inside that root, and cleanup only removes that run's staging tree; the source is never renamed or deleted. Staging is not a malware/content audit. The helper prints the Vercel CLI result rather than claiming permanence, free hosting, or access on every device. No real Vercel deployment is part of this repository's offline tests.
