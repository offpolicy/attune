import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/attune/' : '/',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 8765,
    strictPort: true,
  },
}));
