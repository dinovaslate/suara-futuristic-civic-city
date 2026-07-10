import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        consultations: resolve(import.meta.dirname, 'consultations.html'),
        consultation: resolve(import.meta.dirname, 'consultation.html'),
        myResponses: resolve(import.meta.dirname, 'my-responses.html'),
      },
    },
  },
});
