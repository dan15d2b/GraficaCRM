import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.',
  base: '/',
  server: {
    port: 3000,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/server.ts'),
      fileName: 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['better-sqlite3', '@tauri-apps/api', 'fs'],
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].chunk.js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    }
  },
  esbuild: {
    target: 'node20'
  },
  logLevel: 'info'
});