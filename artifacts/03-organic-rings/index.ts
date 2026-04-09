// ---------------------------------------------------------------------------
// Artifact 03 — Organic Concentric Rings
// ---------------------------------------------------------------------------
// Procedurally generated concentric rings with organic wobble deformation,
// drawn on a Canvas 2D context. Uses a seeded PRNG for reproducibility.
//
// Production usage:
//   import { artifact } from 'wtr-artifacts/03-organic-rings'
//   const handle = artifact.mount(canvasEl, { rings: 30, wobble: 40, drift: 30 })
//   handle.destroy()
// ---------------------------------------------------------------------------

import { createArtifact } from '@shared/create-artifact'
import { seededRng } from '@shared/math'
import type { ControlDef } from '@shared/types'

// ── Config ──────────────────────────────────────────────────────────────────

export interface Config extends Record<string, unknown> {
  rings: number    // 8–60
  wobble: number   // 0–100
  drift: number    // 0–100
  seed: number     // internal — changed by regenerate button
}

const defaults: Config = {
  rings: 30,
  wobble: 40,
  drift: 30,
  seed: Math.floor(Math.random() * 9999),
}

// ── Internal state ───────────────────────────────────────────────────────────

interface State {
  ctx: CanvasRenderingContext2D
  lastSeed: number
  lastConfig: string
}

// ── Draw ─────────────────────────────────────────────────────────────────────

function draw(ctx: CanvasRenderingContext2D, config: Config) {
  const W = ctx.canvas.width
  const H = ctx.canvas.height
  const rand = seededRng(config.seed)
  const wobble = config.wobble / 100
  const drift = config.drift / 100

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#1F2AFF'
  ctx.fillRect(0, 0, W, H)

  const cx = W * 0.5 + (rand() - 0.5) * drift * W * 0.2
  const cy = H * 0.5 + (rand() - 0.5) * drift * H * 0.2
  const maxR = Math.min(W, H) * 0.46
  const STEPS = 200

  for (let ring = 0; ring < config.rings; ring++) {
    const t = ring / config.rings
    const baseR = maxR * t
    const rx = cx + (rand() - 0.5) * drift * baseR * 0.15
    const ry = cy + (rand() - 0.5) * drift * baseR * 0.15

    const freq  = (3 + rand() * 4) | 0
    const amp   = wobble * baseR * (0.04 + rand() * 0.06)
    const phase = rand() * Math.PI * 2
    const freq2  = (5 + rand() * 7) | 0
    const amp2   = wobble * baseR * 0.025
    const phase2 = rand() * Math.PI * 2

    ctx.beginPath()
    for (let i = 0; i <= STEPS; i++) {
      const a = (i / STEPS) * Math.PI * 2
      const r = baseR + Math.sin(a * freq + phase) * amp + Math.sin(a * freq2 + phase2) * amp2
      const x = rx + r * Math.cos(a)
      const y = ry + r * Math.sin(a)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = `rgba(255,255,255,${(0.25 + t * 0.75).toFixed(2)})`
    ctx.lineWidth = 0.8 + t * 0.4
    ctx.stroke()
  }
}

// ── Artifact descriptor ──────────────────────────────────────────────────────

export const controls: ControlDef[] = [
  { type: 'range',  label: 'rings',      key: 'rings',  min: 8,  max: 60, default: defaults.rings },
  { type: 'range',  label: 'wobble',     key: 'wobble', min: 0,  max: 100, default: defaults.wobble },
  { type: 'range',  label: 'drift',      key: 'drift',  min: 0,  max: 100, default: defaults.drift },
  {
    type: 'button',
    label: 'regenerate',
    action: (_config, set) => {
      set('seed', Math.floor(Math.random() * 9999))
    },
  },
]

export const artifact = createArtifact<State, Config>({
  name: 'Organic Concentric Rings',
  slug: '03-organic-rings',
  defaults,
  controls,

  setup(canvas, config) {
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!
    draw(ctx, config)
    return { ctx, lastSeed: config.seed, lastConfig: JSON.stringify(config) }
  },

  render(state, config) {
    // Canvas 2D is immediate-mode: only redraw when config actually changes
    const configStr = JSON.stringify(config)
    if (configStr !== state.lastConfig) {
      draw(state.ctx, config)
      state.lastConfig = configStr
    }
  },

  resize(state, config, width, height) {
    state.ctx.canvas.width = width
    state.ctx.canvas.height = height
    draw(state.ctx, config)
    state.lastConfig = JSON.stringify(config)
  },

  teardown(_state) {
    // Nothing to free for Canvas 2D
  },
})
