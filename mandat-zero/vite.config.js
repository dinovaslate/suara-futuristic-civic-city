import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        petitions: resolve(__dirname, 'petitions.html'),
        petition: resolve(__dirname, 'petition.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        account: resolve(__dirname, 'account.html'),
        dashboard: resolve(__dirname, 'dashboard.html')
      }
    }
  }
});
