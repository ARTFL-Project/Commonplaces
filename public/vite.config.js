import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const api = process.env.API_URL || 'http://127.0.0.1:8444'

export default defineConfig({
  plugins: [vue()],
  server: { proxy: { '/api': api, '/config': api } },
})
