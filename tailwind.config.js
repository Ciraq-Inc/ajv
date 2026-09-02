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
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        custom1: '0px 2px 40px 0px rgba(8, 70, 78, 0.08)',
        custom2: '0px 0px 30px 0px rgba(8, 73, 81, 0.06)',
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
