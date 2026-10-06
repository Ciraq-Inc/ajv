import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Nuxt serves /brand/* from public/, so tests must not try to resolve those URLs as build assets.
  plugins: [vue({ template: { transformAssetUrls: false } })],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
  },
})
