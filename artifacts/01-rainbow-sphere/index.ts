// ---------------------------------------------------------------------------
// Artifact 01 — Rainbow Wireframe Sphere
// ---------------------------------------------------------------------------
// A 3D wireframe sphere with rainbow-colored latitude rings and white
// meridian lines. Auto-rotates and follows mouse movement.
//
// Production usage:
//   import { artifact } from 'wtr-artifacts/01-rainbow-sphere'
//   const handle = artifact.mount(canvasEl, { rings: 18, speed: 2 })
//   handle.destroy() // cleanup
// ---------------------------------------------------------------------------

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  Color,
  Vector2,
} from 'three'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { createArtifact } from '@shared/create-artifact'
import { lerp } from '@shared/math'
import type { ControlDef } from '@shared/types'

// ── Config ─────────────────────────────────────────────────────────────────

export interface Config extends Record<string, unknown> {
  rings: number
  meridians: number
  speed: number
  thickness: number
}

const defaults: Config = {
  rings: 22,
  meridians: 18,
  speed: 3,
  thickness: 6,
}

// ── Internal state ──────────────────────────────────────────────────────────

interface State {
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  sphereGroup: Group
  mouseX: number
  mouseY: number
  targetX: number
  targetY: number
  autoRotY: number
  onMouseMove: (e: MouseEvent) => void
}

// ── Geometry builder ────────────────────────────────────────────────────────

const SEG = 128

function buildSphere(
  group: Group,
  nLat: number,
  nLon: number,
  lw: number,
  res: Vector2,
) {
  // Dispose existing children to free GPU memory
  group.traverse((obj) => {
    if (obj instanceof Line2) {
      obj.geometry.dispose()
      obj.material.dispose()
    }
  })
  group.clear()

  const R = 1.2

  // Latitude rings — rainbow coloured
  for (let i = 0; i <= nLat; i++) {
    const t = i / nLat
    const phi = t * Math.PI
    const hue = ((240 - t * 240) / 360 + 0.5) % 1
    const col = new Color().setHSL(hue, 1, 0.55)
    const positions: number[] = []
    for (let j = 0; j <= SEG; j++) {
      const theta = (j / SEG) * Math.PI * 2
      const r = R * Math.sin(phi)
      positions.push(r * Math.cos(theta), R * Math.cos(phi), r * Math.sin(theta))
    }
    const geo = new LineGeometry()
    geo.setPositions(positions)
    const mat = new LineMaterial({
      color: col,
      linewidth: lw,
      resolution: res,
      transparent: true,
      opacity: 0.95,
    })
    group.add(new Line2(geo, mat))
  }

  // Meridian lines — white, thinner
  for (let j = 0; j < nLon; j++) {
    const theta = (j / nLon) * Math.PI * 2
    const positions: number[] = []
    for (let i = 0; i <= SEG; i++) {
      const phi = (i / SEG) * Math.PI
      positions.push(
        R * Math.sin(phi) * Math.cos(theta),
        R * Math.cos(phi),
        R * Math.sin(phi) * Math.sin(theta),
      )
    }
    const geo = new LineGeometry()
    geo.setPositions(positions)
    const mat = new LineMaterial({
      color: 0xffffff,
      linewidth: lw * 0.4,
      resolution: res,
      transparent: true,
      opacity: 0.15,
    })
    group.add(new Line2(geo, mat))
  }
}

// ── Artifact descriptor ─────────────────────────────────────────────────────

export const controls: ControlDef[] = [
  { type: 'range', label: 'rings',     key: 'rings',     min: 8,  max: 40, default: defaults.rings },
  { type: 'range', label: 'meridians', key: 'meridians', min: 4,  max: 32, default: defaults.meridians },
  { type: 'range', label: 'speed',     key: 'speed',     min: 0,  max: 10, default: defaults.speed },
  { type: 'range', label: 'thickness', key: 'thickness', min: 1,  max: 20, default: defaults.thickness },
]

export const artifact = createArtifact<State, Config>({
  name: 'Rainbow Wireframe Sphere',
  slug: '01-rainbow-sphere',
  defaults,
  controls,

  setup(canvas, config) {
    const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const scene = new Scene()
    const camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100)
    camera.position.z = 3.2

    const sphereGroup = new Group()
    scene.add(sphereGroup)

    const res = new Vector2(canvas.width, canvas.height)
    buildSphere(sphereGroup, config.rings, config.meridians, config.thickness, res)

    let mouseX = 0, mouseY = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove)

    return {
      renderer, scene, camera, sphereGroup,
      mouseX, mouseY, targetX: 0, targetY: 0, autoRotY: 0,
      onMouseMove,
    }
  },

  render(state, config, _time, delta) {
    // Rebuild sphere if structural params changed this frame
    // (tracked via a lightweight dirty check on the group child count)
    const expectedLines = config.rings + 1 + config.meridians
    if (state.sphereGroup.children.length !== expectedLines) {
      const res = new Vector2(
        state.renderer.domElement.width,
        state.renderer.domElement.height,
      )
      buildSphere(state.sphereGroup, config.rings, config.meridians, config.thickness, res)
    }

    state.autoRotY += (config.speed / 1000) * delta * 60
    state.targetX = lerp(state.targetX, state.mouseY * 0.4, 0.05)
    state.targetY = lerp(state.targetY, state.mouseX * 0.4, 0.05)
    state.sphereGroup.rotation.x = state.targetX
    state.sphereGroup.rotation.y = state.autoRotY + state.targetY

    state.renderer.render(state.scene, state.camera)
  },

  resize(state, _config, width, height) {
    state.renderer.setSize(width, height, false)
    state.camera.aspect = width / height
    state.camera.updateProjectionMatrix()
    const res = new Vector2(width, height)
    state.sphereGroup.traverse((obj) => {
      if (obj instanceof Line2 && obj.material) {
        obj.material.resolution.copy(res)
      }
    })
  },

  teardown(state) {
    window.removeEventListener('mousemove', state.onMouseMove)
    state.sphereGroup.traverse((obj) => {
      if (obj instanceof Line2) {
        obj.geometry.dispose()
        obj.material.dispose()
      }
    })
    state.renderer.dispose()
  },
})
