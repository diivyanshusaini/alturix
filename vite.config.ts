import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true, host: '127.0.0.1', allowedHosts: true, proxy: { '/api': 'http://localhost:4000', '/media': 'http://localhost:4000' } },
});
