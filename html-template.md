# HTML authoring contract

Use `examples/starter.html` as the working structural example. Design its content and theme for the actual task.

```html
<!doctype html>
<html lang="zh-CN" data-deck-id="unique-project-deck">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Actual presentation title</title>
  <!-- PPT_STUDIO_CSS -->
  <style>/* Selected design system, authored at 1920×1080. */</style>
</head>
<body>
<div class="deck-viewport"><main class="deck-stage">
  <section class="slide active" data-slide-id="opening" data-slide-title="Title">
    <h1 data-edit-id="opening-title" class="reveal">Actual title</h1>
    <p data-edit-id="opening-summary">Actual summary</p>
    <template data-notes>Full speaker notes for this slide.</template>
  </section>
</main></div>
<!-- PPT_STUDIO_JS -->
</body></html>
```

The bundler replaces exactly one CSS and one JS marker. It embeds `viewport-base.css`, `assets/studio.css` and `assets/studio.js`. Do not duplicate these or add another controller/editor.

Editable elements should be text units, without nested editable IDs or embedded charts. Keep complex visual elements outside them. Text editing is plain text; it is not a rich-text layout editor. A line break in editable text can be preserved with `white-space: pre-wrap` in the theme when needed.

Each slide owns its notes through containment, so moving the entire section keeps notes attached. Slides and editable fields need unique stable semantic IDs. Cloning a slide requires new IDs. Deleted IDs must not be reassigned to unrelated material. `data-slide-title` is a fallback; the presenter uses the current h1/h2 text first.

`data-qa-box` marks a container whose descendant editable text must fit. `data-pptx-shape` marks a simple rectangular box for native PPTX export; keep its editable text in a separate sibling to avoid overlap. SVG, plots and decorated shapes use raster fallback.

Use `.reveal` for gentle entrance and `--reveal-delay` for reading-order staggering. Other motion must have a reduced-motion/final static state. Runtime controls remain outside the stage. Avoid decorative overlays that block text editing or navigation.

Keep selected-reference screenshots and style choices in the task's scratch directory, not on audience slides. Embed resource data before bundling. Plain external hyperlinks are permitted; automatically loaded external resources are not part of an offline deck.
