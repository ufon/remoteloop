import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  root: 'src/ui-mobile',
  plugins: [viteSingleFile()],
  build: {
    // Output goes to mobile/ so Rust include_str! path stays unchanged
    outDir: '../../dist/ui-mobile',
    emptyOutDir: false,
    target: 'es2020',
  },
  clearScreen: false,
})
