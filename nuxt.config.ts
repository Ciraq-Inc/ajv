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
      link: [
        // Google Fonts
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,300;0,400;0,500;0,600;0,700;0,900;1,100;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Slab:wght@100;200;300;400;500;600;700;800;900&display=swap",
        },

        // Remix Icons
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.min.css",
        },
      ],

      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
    },
    // Add page transitions for smoother navigation with pharmacy routing
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "nuxt-vuefire", "nuxt-gtag"],

  css: ["~/assets/css/tailwind.css"],

  // Plugins
  plugins: [
    '~/plugins/init-stores.js'
  ],

  // Add global middleware for pharmacy routing
  router: {
    middleware: ['pharmacy']
  },

  gtag: {
		id: process.env.GTAG_ID,
	},

  vuefire: {
    // PRODUCTION SERVER
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_AUTH_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,

      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },

  routeRules: {
    "/**": { prerender: false },
  },

  // Runtime configuration for API endpoints
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || process.env.API_BASE_URL,
      paystackPublicKey: process.env.NUXT_PUBLIC_PAYSTACK_PUBLIC_KEY || process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_default',
      paystackSecretKey2: process.env.PAYSTACK_SECRET_KEY || '',
      accessControlUsername: process.env.NUXT_PUBLIC_ACCESS_CONTROL_USERNAME || process.env.ACCESS_CONTROL_USERNAME || 'admin',
      accessControlPassword: process.env.NUXT_PUBLIC_ACCESS_CONTROL_PASSWORD || process.env.ACCESS_CONTROL_PASSWORD || ''
    }
  },

  // Dev server configuration
  devServer: {
    port: 4000,
   host: '0.0.0.0', 
  },
});
