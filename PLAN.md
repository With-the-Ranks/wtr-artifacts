# Plan

This document records the architectural decisions made for `wtr-artifacts` and serves as a reference for future development.

## Background

Started as three standalone HTML files with CDN-loaded Three.js and no build tooling. Refactored into a structured Vite + TypeScript playground for scalable artifact development.

## Goals

- Rapid iteration: add new visual artifacts quickly with minimal boilerplate
- Production-ready output: artifacts embed cleanly into the WTR Astro site
- Performance: smooth 60fps rendering is the priority; bundle size is secondary
- Dev ergonomics: live controls, hot reload, no CDN dependencies

## Architecture decisions

### Separate repo, not inside the Astro site

Artifacts need an isolated playground environment with their own dev server. Coupling them to the Astro site's build would slow iteration and add noise. Integration is handled at the import level — the Astro site imports artifact modules directly.

### Vite multi-page app (not a library build)

Each artifact has its own `page.html` dev entry. Vite's multi-page mode gives per-page hot reload. A library build mode is possible in future if packaging for npm is needed.

### `createArtifact` factory pattern

All lifecycle concerns — RAF loop, ResizeObserver, IntersectionObserver, visibility pausing, DPR management, destroy — are handled once in `shared/create-artifact.ts`. Artifacts implement only: `setup`, `render`, `resize`, `teardown`. This eliminates duplicated boilerplate and ensures consistent behavior across all artifacts.

### Dev controls are tree-shaken

`shared/controls.ts` is imported only from `page.html` dev scripts, never from `index.ts` production modules. Vite's tree-shaking eliminates the entire controls module from production bundles automatically.

### Three.js as an npm dependency

Replaces CDN-loaded scripts. Benefits: type safety, consistent versioning, tree-shaking (only import what each artifact uses), no network dependency during dev.

### `mount(canvas, options?) → { destroy, update }` API

The production API is intentionally minimal and framework-agnostic. It works in Astro islands, React effects, Svelte `onMount`, or raw HTML `<script>` tags. The caller owns the canvas element; the artifact never creates or manages the DOM node.

## Performance strategy

| Technique | Rationale |
|---|---|
| DPR capped at 2× | 3× retina on a 27" canvas is GPU-prohibitive |
| `ResizeObserver` with `device-pixel-content-box` | More accurate than `window.resize`; works for iframe embeds |
| `IntersectionObserver` pause | No GPU work when artifact is off-screen |
| Page Visibility API pause | No GPU work in background tabs |
| Delta-time capped at 100ms | Prevents animation jumps after tab focus returns |
| Dirty-check before Canvas 2D redraw | Canvas 2D artifacts skip redraws if config hasn't changed |
| Geometry disposal on rebuild | Three.js geometries/materials freed before recreation to prevent VRAM leaks |

## Future directions

- **OffscreenCanvas + Worker** for Canvas 2D artifacts — moves rendering off the main thread entirely
- **npm package** — publish as `@wtr/artifacts` so the Astro site can pin a version
- **Thumbnail generation** — headless screenshot of each artifact for the gallery page
- **GLSL shader artifacts** — raw WebGL with fragment shaders for maximum GPU performance
- **Storybook-style docs** — each artifact's parameters documented with live previews

## Artifact inventory

| # | Name | Renderer | Key params |
|---|---|---|---|
| 01 | Rainbow Wireframe Sphere | Three.js WebGL | rings, meridians, speed, thickness |
| 02 | Satellite Orbit Globe | Three.js WebGL | inclination, swathWidth |
| 03 | Organic Concentric Rings | Canvas 2D | rings, wobble, drift, seed |
