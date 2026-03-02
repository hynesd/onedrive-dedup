import { defineConfig } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';

export default defineConfig({
  server: {
    proxy: {
      '/auth': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      '/onedrive': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
