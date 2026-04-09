// ---------------------------------------------------------------------------
// Core artifact lifecycle factory
// ---------------------------------------------------------------------------
// Handles: mount, RAF loop, ResizeObserver (DPR-aware), IntersectionObserver
// (pause when off-screen), Page Visibility API (pause when tab hidden),
// and clean destroy(). Artifacts only implement setup/render/resize/teardown.
// ---------------------------------------------------------------------------

import type { ArtifactDescriptor, MountResult } from './types'

const MAX_DPR = 2

export function createArtifact<S, C extends Record<string, unknown>>(
  descriptor: ArtifactDescriptor<S, C>,
) {
  function mount(
    canvas: HTMLCanvasElement,
    overrides: Partial<C> = {},
  ): MountResult {
    const config: C = { ...descriptor.defaults, ...overrides }

    // ── Initial canvas sizing ──────────────────────────────────────────────
    const dpr = Math.min(window.devicePixelRatio ?? 1, MAX_DPR)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    // ── Setup ──────────────────────────────────────────────────────────────
    const state = descriptor.setup(canvas, config)

    // ── RAF loop ───────────────────────────────────────────────────────────
    let rafId = 0
    let lastTime = performance.now()
    let running = true   // controlled by visibility + intersection
    let visible = true   // IntersectionObserver
    let focused = true   // Page Visibility API

    function tick(now: number) {
      rafId = requestAnimationFrame(tick)
      if (!running) return
      const delta = Math.min((now - lastTime) / 1000, 0.1) // cap at 100 ms
      lastTime = now
      descriptor.render(state, config, now / 1000, delta)
    }
    rafId = requestAnimationFrame(tick)

    function updateRunning() {
      running = visible && focused
    }

    // ── Pause when tab hidden ──────────────────────────────────────────────
    function onVisibilityChange() {
      focused = !document.hidden
      updateRunning()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    // ── Pause when scrolled out of view ───────────────────────────────────
    const intersectionObs = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        updateRunning()
      },
      { threshold: 0 },
    )
    intersectionObs.observe(canvas)

    // ── Resize ────────────────────────────────────────────────────────────
    const resizeObs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use devicePixelContentBoxSize when available for pixel-perfect sizing
        let w: number, h: number
        if (entry.devicePixelContentBoxSize) {
          w = entry.devicePixelContentBoxSize[0].inlineSize
          h = entry.devicePixelContentBoxSize[0].blockSize
          canvas.width = Math.round(w)
          canvas.height = Math.round(h)
        } else {
          const dpr2 = Math.min(window.devicePixelRatio ?? 1, MAX_DPR)
          w = Math.round(entry.contentRect.width * dpr2)
          h = Math.round(entry.contentRect.height * dpr2)
          canvas.width = w
          canvas.height = h
        }
        descriptor.resize(state, config, canvas.width, canvas.height)
      }
    })
    resizeObs.observe(canvas, { box: 'device-pixel-content-box' })

    // ── Destroy ───────────────────────────────────────────────────────────
    function destroy() {
      cancelAnimationFrame(rafId)
      resizeObs.disconnect()
      intersectionObs.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      descriptor.teardown(state)
    }

    // ── Update ────────────────────────────────────────────────────────────
    function update(patch: Record<string, unknown>) {
      Object.assign(config, patch)
    }

    return { destroy, update }
  }

  return { mount, descriptor }
}
