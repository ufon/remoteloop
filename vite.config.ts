import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src/ui',
  build: {
    outDir: '../../dist/ui',
    emptyOutDir: true,
  },
  // Keep Rust error output readable during tauri dev
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
})
