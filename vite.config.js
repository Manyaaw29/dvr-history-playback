import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      // All /smart/* → smart.okdriver.in
      '/smart': {
        target: 'https://smart.okdriver.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/smart/, ''),
      },
      // All /dashcam/* → dashcam.okdriver.in
      '/dashcam': {
        target: 'https://dashcam.okdriver.in',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/dashcam/, ''),
      },
    },
  },
})
