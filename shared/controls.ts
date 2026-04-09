// ---------------------------------------------------------------------------
// Dev-only controls overlay
// ---------------------------------------------------------------------------
// Import this ONLY from page.html dev entry scripts, never from artifact
// index.ts files. This keeps it fully tree-shaken from production builds.
// ---------------------------------------------------------------------------

import type { ControlDef, MountResult } from './types'

const OVERLAY_STYLES = `
  #artifact-controls {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    padding: 8px 16px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    color: #ccd;
    z-index: 1000;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  #artifact-controls label {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ccd;
  }
  #artifact-controls input[type=range] {
    vertical-align: middle;
    width: 80px;
    accent-color: #fff;
  }
  #artifact-controls input[type=color] {
    width: 28px;
    height: 22px;
    border: none;
    padding: 0;
    cursor: pointer;
    background: none;
    border-radius: 3px;
  }
  #artifact-controls button {
    font-size: 12px;
    font-family: monospace;
    padding: 4px 12px;
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.1);
    color: #fff;
    transition: background 0.15s;
  }
  #artifact-controls button:hover {
    background: rgba(255,255,255,0.22);
  }
`

/**
 * Inject a dev controls overlay into the page and wire it to the artifact's
 * update() function.
 *
 * @param controls  Array of ControlDef from the artifact descriptor
 * @param artifact  The MountResult returned by artifact.mount()
 * @param getConfig Returns the current config snapshot (for button callbacks)
 */
export function mountControls(
  controls: ControlDef[],
  artifact: MountResult,
  getConfig: () => Record<string, unknown>,
): () => void {
  // Inject styles once
  if (!document.getElementById('artifact-controls-style')) {
    const style = document.createElement('style')
    style.id = 'artifact-controls-style'
    style.textContent = OVERLAY_STYLES
    document.head.appendChild(style)
  }

  const panel = document.createElement('div')
  panel.id = 'artifact-controls'

  for (const ctrl of controls) {
    if (ctrl.type === 'range') {
      const label = document.createElement('label')
      const valSpan = document.createElement('span')
      valSpan.textContent = String(ctrl.default)

      const input = document.createElement('input')
      input.type = 'range'
      input.min = String(ctrl.min)
      input.max = String(ctrl.max)
      input.step = String(ctrl.step ?? 1)
      input.value = String(ctrl.default)

      input.addEventListener('input', () => {
        const num = parseFloat(input.value)
        valSpan.textContent = String(num)
        artifact.update({ [ctrl.key]: num })
      })

      label.append(ctrl.label, ' ', input, ' ', valSpan)
      panel.appendChild(label)
    } else if (ctrl.type === 'color') {
      const label = document.createElement('label')
      const input = document.createElement('input')
      input.type = 'color'
      input.value = ctrl.default

      input.addEventListener('input', () => {
        artifact.update({ [ctrl.key]: input.value })
      })

      label.append(ctrl.label, ' ', input)
      panel.appendChild(label)
    } else if (ctrl.type === 'button') {
      const btn = document.createElement('button')
      btn.textContent = ctrl.label
      btn.addEventListener('click', () => {
        ctrl.action(getConfig(), (key, val) => artifact.update({ [key]: val }))
      })
      panel.appendChild(btn)
    }
  }

  document.body.appendChild(panel)

  // Return cleanup function
  return () => {
    panel.remove()
  }
}
