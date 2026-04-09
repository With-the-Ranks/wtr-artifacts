import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'shared'),
      '@artifacts': resolve(__dirname, 'artifacts'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Gallery index
        main: resolve(__dirname, 'index.html'),
        // Artifact dev pages
        'rainbow-sphere': resolve(__dirname, 'artifacts/01-rainbow-sphere/page.html'),
        'satellite-orbit': resolve(__dirname, 'artifacts/02-satellite-orbit/page.html'),
        'organic-rings':   resolve(__dirname, 'artifacts/03-organic-rings/page.html'),        'chris-test': resolve(__dirname, 'artifacts/04-chris-test/page.html'),

      },
    },
    // Output clean ES modules for easy embedding
    target: 'es2020',
    // Keep chunks readable for debugging
    chunkSizeWarningLimit: 600,
  },
  // Make imports from shared/ and artifacts/ available inside page.html <script type="module">
  optimizeDeps: {
    include: ['three'],
  },
})
