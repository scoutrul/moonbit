/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Для корректной работы в IDE с TypeScript
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || '')
  },
  envPrefix: 'VITE_', // Разрешить только переменные с префиксом VITE_
  server: {
    port: 3000,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Автоматическое определение target для разных сред:
        // - В dev режиме (локально): используем localhost:3001
        // - В Docker: используем переменную окружения VITE_API_URL
        target: process.env.VITE_API_URL ? 
          process.env.VITE_API_URL.replace('/api', '') :  // Убираем /api из URL если есть
          'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './__tests__/setup.js',
  }
});
