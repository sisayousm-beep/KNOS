import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Tauri controls the window; don't pop a browser, and keep the port fixed.
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  // gzip-size reporting crashes Node on this machine (0xC0000409); skip it.
  build: { reportCompressedSize: false },
});
