import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Empaqueta el motor 3D (Three.js + coreografía de armado) en UN archivo
// IIFE que el tema carga bajo demanda desde assets/ cuando alguien toca
// "Diseña la tuya". Expone window.KYN3D.
export default defineConfig({
  build: {
    outDir: resolve(__dirname, '../assets'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/kyn-3d.ts'),
      name: 'KYN3D',
      formats: ['iife'],
      fileName: () => 'kyn-3d.js',
    },
    target: 'es2019',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
