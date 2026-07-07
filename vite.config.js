import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        explore: resolve(import.meta.dirname, 'explore.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
        petitions: resolve(import.meta.dirname, 'petitions.html'),
        petition: resolve(import.meta.dirname, 'petition.html'),
      },
    },
  },
});
