# Agents

This document describes how AI coding agents (Claude, Copilot, etc.) should work within this repository.

## Repo purpose

`wtr-artifacts` is a Vite + TypeScript playground for building canvas/WebGL visual artifacts used as hero backgrounds, section treatments, and motion accents on the WTR website. Artifacts are standalone, framework-agnostic ES modules that expose a `mount(canvas, options?)` API.

## Key constraints for agents

### Never break the production API

Every `artifacts/*/index.ts` must export:
- `artifact` — the object returned by `createArtifact()`, with a `.mount()` method
- `controls` — the `ControlDef[]` array for the dev overlay

The `mount()` function signature is:
```ts
mount(canvas: HTMLCanvasElement, overrides?: Partial<Config>): MountResult
```

`MountResult` has exactly two methods: `destroy()` and `update(patch)`. Do not change this contract.

### Dev controls must stay tree-shakeable

`shared/controls.ts` must **never** be imported from any `artifacts/*/index.ts` file. It is imported only from `artifacts/*/page.html` `<script type="module">` blocks. This ensures the controls overlay is fully absent from production bundles.

### GPU resource cleanup is mandatory

Every `teardown()` implementation must dispose of all Three.js geometries, materials, and renderers, or cancel any Canvas 2D timers. Leaking GPU memory is a hard bug.

### Performance defaults

- Cap `devicePixelRatio` at 2 (handled by `createArtifact`)
- Do not use `window.addEventListener('resize', ...)` directly — `createArtifact` provides `ResizeObserver`
- Do not run a raw `requestAnimationFrame` loop directly — use `createArtifact`'s render callback
- Avoid recreating geometries/materials every frame; use dirty flags and rebuild only on config changes

## Adding a new artifact

1. Run `npm run new "Artifact Name"` — this scaffolds the directory, updates `vite.config.ts` and `index.html`
2. Edit `artifacts/NN-slug/index.ts`: define `Config`, `State`, implement `setup`, `render`, `resize`, `teardown`
3. Add entries to the `controls` array for any interactive parameters
4. Test in dev with `npm run dev` — navigate to the artifact page and verify controls work

## Shared utilities

| File | Contents |
|---|---|
| `shared/create-artifact.ts` | Lifecycle factory — use this for every artifact |
| `shared/math.ts` | `lerp`, `clamp`, `mapRange`, `seededRng`, `deg2rad` |
| `shared/types.ts` | `ControlDef`, `MountResult`, `ArtifactDescriptor` |
| `shared/controls.ts` | Dev overlay — import only from `page.html` scripts |

## File naming convention

Artifact directories follow `NN-kebab-slug` where `NN` is a zero-padded two-digit number (e.g. `04-aurora-waves`). The scaffold script assigns numbers automatically.

## What agents should NOT do

- Do not install new npm packages without a clear reason; check `shared/math.ts` and `three` first
- Do not modify `shared/create-artifact.ts` lifecycle behavior without updating all artifacts that depend on it
- Do not add inline `<style>` or duplicate CSS to `page.html` files — the boilerplate style block is intentionally minimal
- Do not commit `dist/` or `node_modules/`
- Do not flatten artifacts back into root-level HTML files
