// ---------------------------------------------------------------------------
// Artifact 02 — Satellite Orbit Globe
// ---------------------------------------------------------------------------
// A 3D wireframe globe with a satellite orbiting along an inclined path,
// with swath boundary lines showing ground coverage.
//
// Production usage:
//   import { artifact } from 'wtr-artifacts/02-satellite-orbit'
//   const handle = artifact.mount(canvasEl, { inclination: 51, swathWidth: 15 })
//   handle.destroy()
// ---------------------------------------------------------------------------

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Vector3,
} from 'three'
import { createArtifact } from '@shared/create-artifact'
import { deg2rad } from '@shared/math'
import type { ControlDef } from '@shared/types'

// ── Config ──────────────────────────────────────────────────────────────────

export interface Config extends Record<string, unknown> {
  inclination: number  // degrees, 0–90
  swathWidth: number   // degrees, 5–40
}

const defaults: Config = {
  inclination: 51,
  swathWidth: 15,
}

// ── Internal state ───────────────────────────────────────────────────────────

interface State {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  globe: Mesh
  orbitGroup: Group
  sat: Mesh
  t: number
  satT: number
  lastInclination: number
  lastSwathWidth: number
}

// ── Geometry builders ────────────────────────────────────────────────────────

const STEPS = 300

function makeCirclePoints(radius: number, inclRad: number): Vector3[] {
  const pts: Vector3[] = []
  for (let i = 0; i <= STEPS; i++) {
    const u = (i / STEPS) * Math.PI * 2
    pts.push(new Vector3(
      Math.cos(u) * radius,
      Math.sin(u) * Math.sin(inclRad) * radius,
      Math.sin(u) * Math.cos(inclRad) * radius,
    ))
  }
  return pts
}

function buildOrbit(group: Group, inclDeg: number, swathDeg: number) {
  // Dispose old geometries
  group.traverse((obj) => {
    if (obj instanceof Line || obj instanceof LineSegments) {
      obj.geometry.dispose()
    }
  })
  group.clear()

  const incl = deg2rad(inclDeg)
  const swath = deg2rad(swathDeg)
  const R = 1.35
  const Rs = 1.01

  // Orbit path
  const orbitPts = makeCirclePoints(R, incl)
  group.add(new Line(
    new BufferGeometry().setFromPoints(orbitPts),
    new LineBasicMaterial({ color: 0xff4422, opacity: 0.9, transparent: true }),
  ))

  // Swath boundaries
  for (const side of [-1, 1] as const) {
    const sPts: Vector3[] = []
    for (let i = 0; i <= STEPS; i++) {
      const u = (i / STEPS) * Math.PI * 2
      sPts.push(new Vector3(
        Math.cos(u) * Rs,
        (Math.sin(u) * Math.sin(incl) + side * Math.sin(swath) * Math.cos(incl)) * Rs,
        (Math.sin(u) * Math.cos(incl) - side * Math.sin(swath) * Math.sin(incl)) * Rs,
      ))
    }
    group.add(new Line(
      new BufferGeometry().setFromPoints(sPts),
      new LineBasicMaterial({ color: 0xff6644, opacity: 0.28, transparent: true }),
    ))
  }
}

// ── Artifact descriptor ──────────────────────────────────────────────────────

export const controls: ControlDef[] = [
  { type: 'range', label: 'inclination', key: 'inclination', min: 0,  max: 90, default: defaults.inclination },
  { type: 'range', label: 'swath width', key: 'swathWidth',  min: 5,  max: 40, default: defaults.swathWidth },
]

export const artifact = createArtifact<State, Config>({
  name: 'Satellite Orbit Globe',
  slug: '02-satellite-orbit',
  defaults,
  controls,

  setup(canvas, config) {
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new Scene()
    const camera = new PerspectiveCamera(40, canvas.width / canvas.height, 0.1, 100)
    camera.position.z = 3.8

    // Globe
    const globe = new Mesh(
      new SphereGeometry(1, 24, 16),
      new MeshBasicMaterial({ color: 0x66ffaa, wireframe: true, opacity: 0.22, transparent: true }),
    )
    scene.add(globe)

    // Equator ring
    const eqPts: Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      eqPts.push(new Vector3(Math.cos(i / 128 * Math.PI * 2), 0, Math.sin(i / 128 * Math.PI * 2)))
    }
    scene.add(new Line(
      new BufferGeometry().setFromPoints(eqPts),
      new LineBasicMaterial({ color: 0x88ffcc, opacity: 0.35, transparent: true }),
    ))

    // Bounding box overlay on globe surface
    const boxPts = [
      new Vector3(-0.4, -0.25, 1.01), new Vector3(0.4, -0.25, 1.01),
      new Vector3(0.4, -0.25, 1.01),  new Vector3(0.4,  0.25, 1.01),
      new Vector3(0.4,  0.25, 1.01),  new Vector3(-0.4, 0.25, 1.01),
      new Vector3(-0.4, 0.25, 1.01),  new Vector3(-0.4, -0.25, 1.01),
    ]
    scene.add(new LineSegments(
      new BufferGeometry().setFromPoints(boxPts),
      new LineBasicMaterial({ color: 0xffffff, opacity: 0.45, transparent: true }),
    ))

    // Orbit group
    const orbitGroup = new Group()
    scene.add(orbitGroup)
    buildOrbit(orbitGroup, config.inclination, config.swathWidth)

    // Satellite dot
    const sat = new Mesh(
      new SphereGeometry(0.035, 8, 8),
      new MeshBasicMaterial({ color: 0xff4422 }),
    )
    scene.add(sat)

    return {
      renderer, scene, camera, globe, orbitGroup, sat,
      t: 0, satT: 0,
      lastInclination: config.inclination,
      lastSwathWidth: config.swathWidth,
    }
  },

  render(state, config, _time, delta) {
    // Rebuild orbit if params changed
    if (
      state.lastInclination !== config.inclination ||
      state.lastSwathWidth !== config.swathWidth
    ) {
      buildOrbit(state.orbitGroup, config.inclination, config.swathWidth)
      state.lastInclination = config.inclination
      state.lastSwathWidth = config.swathWidth
    }

    state.t += 0.002 * delta * 60
    state.satT += 0.008 * delta * 60

    const incl = deg2rad(config.inclination)
    state.sat.position.set(
      Math.cos(state.satT) * 1.35,
      Math.sin(state.satT) * Math.sin(incl) * 1.35,
      Math.sin(state.satT) * Math.cos(incl) * 1.35,
    )

    state.globe.rotation.y = state.t * 0.2
    state.renderer.render(state.scene, state.camera)
  },

  resize(state, _config, width, height) {
    state.renderer.setSize(width, height, false)
    state.camera.aspect = width / height
    state.camera.updateProjectionMatrix()
  },

  teardown(state) {
    state.globe.geometry.dispose()
    ;(state.globe.material as MeshBasicMaterial).dispose()
    state.sat.geometry.dispose()
    ;(state.sat.material as MeshBasicMaterial).dispose()
    state.orbitGroup.traverse((obj) => {
      if (obj instanceof Line || obj instanceof LineSegments) {
        obj.geometry.dispose()
      }
    })
    state.renderer.dispose()
  },
})
