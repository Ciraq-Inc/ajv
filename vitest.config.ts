import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Nuxt serves /brand/* from public/, so tests must not try to resolve those URLs as build assets.
  plugins: [vue({ template: { transformAssetUrls: false } })],
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('.', import.meta.url)),
      // Templates that import images as "~/assets/…" are rewritten to a bare "assets/…" specifier.
      assets: fileURLToPath(new URL('./assets', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
    // Browser specs: Playwright runs these (playwright.config.js, playwright.email-auth.config.js).
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**',
      'tests/order-requests.test.js',
      'tests/professional-feature.test.js',
      'tests/sales-reports-mobile.test.js',
    ],
  },
})
