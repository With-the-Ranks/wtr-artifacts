// ---------------------------------------------------------------------------
// Shared types for all artifacts
// ---------------------------------------------------------------------------

/**
 * A single interactive control exposed in the dev overlay.
 * Tree-shaken away in production builds (never imported by artifact index.ts).
 */
export type ControlType = 'range' | 'button' | 'color'

export interface RangeControlDef {
  type: 'range'
  label: string
  /** Key in the Config object this control drives */
  key: string
  min: number
  max: number
  step?: number
  default: number
}

export interface ButtonControlDef {
  type: 'button'
  label: string
  /** Called when the button is clicked; receives current config and a setter */
  action: (config: Record<string, unknown>, set: (key: string, val: unknown) => void) => void
}

export interface ColorControlDef {
  type: 'color'
  label: string
  key: string
  default: string
}

export type ControlDef = RangeControlDef | ButtonControlDef | ColorControlDef

/**
 * Returned by every artifact's mount() function.
 * Gives the caller lifecycle control.
 */
export interface MountResult {
  /** Stop the RAF loop, remove all event listeners, free GPU resources */
  destroy(): void
  /** Programmatically update one or more config values at runtime */
  update(patch: Record<string, unknown>): void
}

/**
 * The factory config passed to createArtifact().
 * S = internal renderer state, C = public config object.
 */
export interface ArtifactDescriptor<S, C extends Record<string, unknown>> {
  /** Human-readable name shown in the gallery */
  name: string
  /** Unique slug, matches the folder name */
  slug: string
  /** Default parameter values */
  defaults: C
  /** Called once on mount. Return your renderer state. */
  setup(canvas: HTMLCanvasElement, config: C): S
  /** Called every frame inside the RAF loop. */
  render(state: S, config: C, time: number, delta: number): void
  /** Called when canvas dimensions change. */
  resize(state: S, config: C, width: number, height: number): void
  /** Called on destroy. Free all GPU/CPU resources. */
  teardown(state: S): void
  /** Dev-only: control definitions for the overlay panel */
  controls?: ControlDef[]
}
