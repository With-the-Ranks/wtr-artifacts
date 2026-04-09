#!/usr/bin/env tsx
// ---------------------------------------------------------------------------
// scripts/new-artifact.ts
// Usage: npm run new "My Cool Effect"
// ---------------------------------------------------------------------------
// Creates a new numbered artifact directory from the _template, updates
// vite.config.ts and index.html to include it automatically.
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Parse args ───────────────────────────────────────────────────────────────

const rawName = process.argv[2]
if (!rawName) {
  console.error('Usage: npm run new "Artifact Name"')
  process.exit(1)
}

const name = rawName.trim()

// ── Derive slug and number ────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function nextNumber(): string {
  const artifactsDir = join(ROOT, 'artifacts')
  const existing = readdirSync(artifactsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
    .map((d) => parseInt(d.name.slice(0, 2), 10))
  const max = existing.length > 0 ? Math.max(...existing) : 0
  return String(max + 1).padStart(2, '0')
}

const num = nextNumber()
const slug = toSlug(name)
const dirName = `${num}-${slug}`
const artifactDir = join(ROOT, 'artifacts', dirName)

if (existsSync(artifactDir)) {
  console.error(`Directory already exists: artifacts/${dirName}`)
  process.exit(1)
}

// ── Copy template ─────────────────────────────────────────────────────────────

const templateDir = join(ROOT, 'artifacts', '_template')

mkdirSync(artifactDir, { recursive: true })

for (const file of ['index.ts', 'page.html']) {
  const src = readFileSync(join(templateDir, file), 'utf8')
  const out = src
    .replaceAll('ARTIFACT_NAME', name)
    .replaceAll('NN-slug', dirName)
    .replaceAll('NN', num)
  writeFileSync(join(artifactDir, file), out)
}

console.log(`Created artifacts/${dirName}/`)

// ── Update vite.config.ts ─────────────────────────────────────────────────────

const vitePath = join(ROOT, 'vite.config.ts')
let vite = readFileSync(vitePath, 'utf8')

// Find the last artifact entry line and insert after it
const lastArtifactMatch = [...vite.matchAll(/^\s+'[\w-]+':\s+resolve\(__dirname,\s+'artifacts\/[^']+'\),\s*$/gm)]
if (lastArtifactMatch.length > 0) {
  const last = lastArtifactMatch[lastArtifactMatch.length - 1]
  const insertAfter = last.index! + last[0].length
  const newEntry = `        '${slug}': resolve(__dirname, 'artifacts/${dirName}/page.html'),\n`
  vite = vite.slice(0, insertAfter) + newEntry + vite.slice(insertAfter)
  writeFileSync(vitePath, vite)
  console.log(`Updated vite.config.ts`)
}

// ── Update index.html ─────────────────────────────────────────────────────────

const indexPath = join(ROOT, 'index.html')
let html = readFileSync(indexPath, 'utf8')

const anchor = `  <a href="artifacts/${dirName}/page.html">${num} — ${name}</a>`

// Insert before closing </body>
html = html.replace('</body>', `${anchor}\n</body>`)
writeFileSync(indexPath, html)
console.log(`Updated index.html`)

// ── Done ──────────────────────────────────────────────────────────────────────

console.log(`\nDone! Open: http://localhost:5173/artifacts/${dirName}/page.html`)
console.log(`Or run:    npm run dev`)
