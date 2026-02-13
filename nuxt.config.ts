// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },
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
      apiBase: process.env.API_BASE_URL,
      paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_default',
      paystackSecretKey2: process.env.PAYSTACK_SECRET_KEY || '',
      accessControlUsername: process.env.ACCESS_CONTROL_USERNAME || 'admin',
      accessControlPassword: process.env.ACCESS_CONTROL_PASSWORD || ''
    }
  },

  // Dev server configuration
  devServer: {
    port: 4000,
   host: '0.0.0.0', 
  },
});
