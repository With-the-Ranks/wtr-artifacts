// ---------------------------------------------------------------------------
// Artifact NN — ARTIFACT_NAME
// ---------------------------------------------------------------------------
// One-line description of what this artifact renders.
//
// Production usage:
//   import { artifact } from 'wtr-artifacts/NN-slug'
//   const handle = artifact.mount(canvasEl, { speed: 1.0 })
//   handle.destroy()
// ---------------------------------------------------------------------------

import { createArtifact } from '@shared/create-artifact'
import type { ControlDef } from '@shared/types'
// Uncomment if you need Three.js:
// import { WebGLRenderer, Scene, PerspectiveCamera } from 'three'
// Uncomment if you need math utils:
// import { lerp, seededRng } from '@shared/math'

// ── Config ──────────────────────────────────────────────────────────────────
// All public parameters the artifact exposes. Must extend Record<string, unknown>.

export interface Config extends Record<string, unknown> {
  speed: number
  // add more params here
}

const defaults: Config = {
  speed: 1.0,
}

// ── Internal state ───────────────────────────────────────────────────────────
// Anything your renderer needs between frames. Returned by setup(), passed to
// render(), resize(), and teardown().

interface State {
  ctx: CanvasRenderingContext2D
  // or: renderer: WebGLRenderer, scene: Scene, camera: PerspectiveCamera, ...
}

// ── Artifact descriptor ──────────────────────────────────────────────────────

export const controls: ControlDef[] = [
  { type: 'range', label: 'speed', key: 'speed', min: 0, max: 10, step: 0.1, default: defaults.speed },
  // add more controls here
]

export const artifact = createArtifact<State, Config>({
  name: 'ARTIFACT_NAME',
  slug: 'NN-slug',
  defaults,
  controls,

  setup(canvas, _config): State {
    // Initialize your renderer here.
    // For Canvas 2D:
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!
    // For WebGL / Three.js, create WebGLRenderer, Scene, Camera, etc.
    return { ctx }
  },

  render(state, _config, _time, _delta) {
    // Called every animation frame. Draw your frame here.
    const { ctx } = state
    const W = ctx.canvas.width
    const H = ctx.canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1F2AFF'
    ctx.fillRect(0, 0, W, H)
    // ... your rendering logic
  },

  resize(state, config, width, height) {
    // Called when the canvas is resized. Update camera aspect, renderer size, etc.
    state.ctx.canvas.width = width
    state.ctx.canvas.height = height
    // Re-render immediately after resize so there's no blank frame
    this.render(state, config, 0, 0)
  },

  teardown(_state) {
    // Free GPU resources, remove event listeners, cancel timers.
    // For Three.js: state.renderer.dispose(), geometry.dispose(), material.dispose()
    // For Canvas 2D: nothing needed
  },
})
