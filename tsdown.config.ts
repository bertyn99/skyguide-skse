import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { skyguide: './src/index.ts' },
  format: 'cjs',
  outExtensions: () => ({ js: '.js' }),
  platform: 'node',
  target: 'es2018',
  external: ['skyrimPlatform'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
})
