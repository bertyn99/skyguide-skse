import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { skyguide: './src/index.ts' },
  format: 'cjs',
  platform: 'node',
  external: ['skyrimPlatform'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
})
