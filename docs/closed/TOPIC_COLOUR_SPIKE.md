# Topic colour comparison

**Status:** superseded by Signal on Slate (#225/#226); preview retired in #248.
**Authority:** historical colour study only. DESIGN.md and src/styles/tokens.css define the current standard.

The comparison keeps the gunmetal chassis and spends track colour on the topic hero wash and the active acronym letter. Both variants keep steel for Test, tarnish for Repair, and settled slate for Test again. The Library is included as a control and retains its existing colour.

| Variant | Learning | Survival | Tradecraft |
| --- | --- | --- | --- |
| Current | `oklch(.76 .085 250)` | `oklch(.77 .075 205)` | `oklch(.75 .085 300)` |
| Raised | `oklch(.76 .13 250)` | `oklch(.77 .12 205)` | `oklch(.75 .13 300)` |

Historical preview instructions (the preview and capture script were removed in #248):

Start the local Vite development server without Firebase configuration, then open `/?colour=current` or `/?colour=raised`. The selector is development-only, persists nothing, and leaves shared tokens unchanged. Production builds ignore it.

Run `node scripts/captureTopicColour.mjs` against the server (default `http://127.0.0.1:4185`; override with `ARGUS_COLOUR_ORIGIN`). It captures the actual Library, topic, ordered Test, Repair and Banked screens at 390×844 with reduced motion. The generated `test-results/topic-colour/comparison.html` places variants beside each other; `manifest.json` records screenshots and contrast. Set `ARGUS_COLOUR_OUTPUT` for a different artifact folder.

The script measures rendered sRGB values after browser conversion. Active-letter contrast against `--surface-2` is 7.08–8.00:1 for Current and 6.97–8.17:1 for Raised. Action ink contrasts are 16.56:1 on steel, 7.26:1 on tarnish, and 6.62:1 on settled slate. All exceed 4.5:1. Hero washes carry no essential text and retain the same neutral recognition icon.

Signal on Slate superseded this comparison with solid opaque surfaces. The historical instructions and measurements above are retained for provenance and no longer reproduce a supported preview.
