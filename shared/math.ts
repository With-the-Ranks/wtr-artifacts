// ---------------------------------------------------------------------------
// Math utilities shared across artifacts
// ---------------------------------------------------------------------------

/** Linear interpolation between a and b by t ∈ [0, 1] */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Clamp x to [min, max] */
export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x))
}

/** Map x from [inMin, inMax] to [outMin, outMax] */
export function mapRange(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((x - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/** Clamp then map */
export function mapRangeClamped(
  x: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return mapRange(clamp(x, inMin, inMax), inMin, inMax, outMin, outMax)
}

/**
 * Seeded pseudo-random number generator (LCG).
 * Returns a function that yields numbers in [0, 1) reproducibly.
 *
 * @example
 * const rand = seededRng(42)
 * rand() // 0.something deterministic
 */
export function seededRng(seed: number): () => number {
  let s = seed | 0
  return function rand(): number {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0x1_0000_0000
  }
}

/** Degrees → radians */
export const DEG2RAD = Math.PI / 180
export function deg2rad(deg: number): number {
  return deg * DEG2RAD
}

/** Radians → degrees */
export const RAD2DEG = 180 / Math.PI
export function rad2deg(rad: number): number {
  return rad * RAD2DEG
}
