import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/harness/',
  root: resolve(import.meta.dirname, 'harness'),
  build: {
    outDir: resolve(import.meta.dirname, '../.output/e2e-harness'),
    emptyOutDir: true,
  },
});
