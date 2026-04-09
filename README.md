# wtr-artifacts

A playground for building and refining visual artifacts — canvas animations, WebGL scenes, and generative graphics — intended for use as hero backgrounds, section treatments, and motion accents on the WTR website.

## Quick start

```bash
npm install
npm run dev        # starts Vite dev server at http://localhost:5173
```

Open the gallery at `http://localhost:5173` and click through to individual artifacts. Each artifact has an interactive control panel for tweaking parameters in real time.

## Add a new artifact

```bash
npm run new "Aurora Waves"
# Creates artifacts/04-aurora-waves/
# Updates vite.config.ts and index.html automatically
```

Then edit `artifacts/04-aurora-waves/index.ts` — start from the template, implement `setup`, `render`, `resize`, and `teardown`.

## Project structure

```
wtr-artifacts/
├── artifacts/
│   ├── 01-rainbow-sphere/
│   │   ├── index.ts      # Artifact logic — the production export
│   │   └── page.html     # Dev entry page (controls overlay, hot reload)
│   ├── 02-satellite-orbit/
│   ├── 03-organic-rings/
│   └── _template/        # Boilerplate for new artifacts
├── shared/
│   ├── create-artifact.ts # Lifecycle factory (RAF, resize, visibility, DPR)
│   ├── controls.ts        # Dev-only controls overlay (tree-shaken in prod)
│   ├── math.ts            # lerp, clamp, seededRng, deg2rad, mapRange
│   └── types.ts           # Shared TypeScript types
├── scripts/
│   └── new-artifact.ts    # Scaffold CLI
├── index.html             # Gallery / navigation
└── vite.config.ts
```

## Using an artifact in production (Astro site)

Each artifact's `index.ts` exports a framework-agnostic `artifact` object with a `mount()` function:

```astro
---
// src/components/HeroBg.astro
---
<canvas id="hero-bg" style="position:absolute;inset:0;width:100%;height:100%;"></canvas>

<script>
  import { artifact } from '../path/to/wtr-artifacts/artifacts/01-rainbow-sphere/index.ts'

  const canvas = document.getElementById('hero-bg') as HTMLCanvasElement
  const handle = artifact.mount(canvas, { rings: 18, speed: 2 })

  // Cleanup on Astro view transitions
  document.addEventListener('astro:before-swap', () => handle.destroy(), { once: true })
</script>
```

The controls overlay (`shared/controls.ts`) is **never imported** from `index.ts`, so it is fully tree-shaken from production builds.

## Production build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Performance notes

- **DPR capped at 2×** — prevents 3× retina displays from destroying GPU on large canvases
- **RAF pauses automatically** when the tab is hidden (`document.hidden`) or the canvas is scrolled out of view (`IntersectionObserver`)
- **ResizeObserver** with `device-pixel-content-box` for pixel-perfect canvas sizing without layout thrash
- **Three.js tree-shaken** — only the classes each artifact imports are bundled
- Canvas 2D artifacts only redraw when config actually changes (dirty-check), not every frame
