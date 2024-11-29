// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
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
	},

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
	'@pinia/nuxt',
	'nuxt-vuefire'
  ],

  css: ["~/assets/css/tailwind.css"],

  vuefire: {
	// PRODUCTION SERVER
	config: {
		apiKey: process.env.FIREBASE_API_KEY,
		authDomain: "referral-system-5cebe.firebaseapp.com",
		databaseURL: "https://referral-system-5cebe-default-rtdb.europe-west1.firebasedatabase.app",
		projectId: "referral-system-5cebe",
		storageBucket: "referral-system-5cebe.appspot.com",
		messagingSenderId: "110599877750",
		appId: "1:110599877750:web:f8cb21ad5275d11d75db57",
		measurementId: "G-81Q9KWP8LW"
	},

}
}
)
