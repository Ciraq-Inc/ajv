// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  buildDir: process.env.NUXT_BUILD_DIR || '.nuxt',
  vite: {
    warmupEntry: false,
    plugins: [
      {
        name: 'fix-plugin-vue-export-helper-windows',
        enforce: 'pre',
        resolveId(id: string) {
          if (id === 'plugin-vue:export-helper' || id === '\0plugin-vue:export-helper') {
            return 'virtual:plugin-vue-export-helper'
          }
        },
        load(id: string) {
          if (id === 'virtual:plugin-vue-export-helper' || id === '\0plugin-vue:export-helper') {
            return `export default (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) { target[key] = val; }
  return target;
}`
          }
        }
      }
    ]
  },

  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
    },
    // Add page transitions for smoother navigation with pharmacy routing
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  modules: ["@nuxtjs/tailwindcss", "@nuxt/fonts", "@pinia/nuxt", "nuxt-gtag"],

  fonts: {
    families: [
      {
        name: 'Poppins',
        provider: 'google',
        weights: ['100', '300', '400', '500', '600', '700', '900'],
        styles: ['normal', 'italic'],
      },
      {
        name: 'Roboto Slab',
        provider: 'google',
        weights: ['100 900'],
        styles: ['normal'],
      },
      {
        name: 'JetBrains Mono',
        provider: 'google',
        weights: ['400', '500'],
        styles: ['normal'],
      },
      {
        name: 'Space Grotesk',
        provider: 'google',
        weights: ['500', '700', '800'],
        styles: ['normal'],
      },
      {
        name: 'Manrope',
        provider: 'google',
        weights: ['400', '500', '700'],
        styles: ['normal'],
      },
    ],
  },

  css: ["~/assets/css/tailwind.css"],

  // Plugins
  plugins: [
    '~/plugins/init-stores.js'
  ],

  gtag: {
		id: process.env.GTAG_ID,
	},

  routeRules: {
    "/**": { prerender: false },
  },

  // Runtime configuration for API endpoints.
  // Server-only secrets MUST live at the top level — anything under `public`
  // is bundled into client JS and visible via View Source. Do not re-add
  // `paystackSecretKey2` / `accessControlPassword` to `public` for any reason.
  runtimeConfig: {
    // Server-only (never sent to the browser)
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY || '',
    accessControlUsername: process.env.ACCESS_CONTROL_USERNAME || '',
    accessControlPassword: process.env.ACCESS_CONTROL_PASSWORD || '',

    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.API_BASE_URL,
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_default',
    }
  },

  // Dev server configuration
  devServer: {
    port: 4000,
   host: '0.0.0.0', 
  },
});
