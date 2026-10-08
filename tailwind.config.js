import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  theme: {
    container: {
      padding: {
        DEFAULT: '15px',
      }
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '976px',
      xl: '1440px'
    },
    extend: {
      colors:{
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: '#242a2b',
        primaryShadcn: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: '#767676',
        secondaryShadcn: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: '#3C0753',
          secondary: '#720455',
          tertiary: '#910A67',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // MedsGh storefront palette (Rigelis purple + coral CTA). Static hex so
        // opacity modifiers (bg-brand-700/10) keep working.
        brand: {
          50: '#F6EEFB',
          100: '#EAD5F5',
          200: '#D4AEEB',
          300: '#B983DC',
          400: '#9B5FC9',
          500: '#7C3FB4',
          600: '#62309A',
          700: '#520094',
          800: '#33155A',
          900: '#1F0B3C',
          950: '#120621',
        },
        coral: {
          300: '#FFB49E',
          400: '#FB8D74',
          500: '#F15733',
          600: '#D13E1C',
          700: '#B03217',
        },
        ink: {
          50: '#F3F0F7',
          100: '#E7E2EE',
          200: '#D0C8DB',
          400: '#776B89',
          500: '#544A64',
          600: '#3A3248',
          900: '#0D0915',
        },
        grey: '#e8f0f1',
        brightRed: 'hsl(12, 88%, 59%)',
        darkBlue: 'hsl(228, 39%, 23%)',
        darkGrayishBlue: 'hsl(227, 12%, 46%)',
        veryDarkBlue: 'hsl(233, 12%, 13%)',
        veryPaleRed: 'hsl(13, 100%, 96%)',
        veryLightGray: 'hsl(0, 0%, 98%)',
        eventDarkPurple: 'hsl(258, 74%, 10%)',
        eventLightPurple: 'hsl(258, 60%, 31%)',
      },
      fontFamily: {
        primary: 'Poppins',
        secondary: 'Roboto Slab',
        display: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      boxShadow: {
        custom1: '0px 2px 40px 0px rgba(8, 70, 78, 0.08)',
        custom2: '0px 0px 30px 0px rgba(8, 73, 81, 0.06)',
        soft: '0 1px 2px rgba(18,6,33,0.05), 0 8px 24px -8px rgba(18,6,33,0.10)',
        lift: '0 2px 4px rgba(18,6,33,0.05), 0 24px 48px -16px rgba(82,0,148,0.28)',
        glow: '0 0 0 1px rgba(255,255,255,0.12) inset, 0 12px 32px -8px rgba(209,62,28,0.55)',
      },
      backgroundImage: {
        services: "url('/assets/images/services/bg.svg')",
        testimonial: "url('/assets/images/testimonials/bg.svg')",
        quoteLeft: "url('/assets/images/testimonials/quote-left.svg')",
        quoteRight: "url('/assets/images/testimonials/quote-right.svg')",
        bgPattern: "url('/assets/images/resources/pattern-bg.svg')",
      },
    },
  },
  plugins: [animate],
}
