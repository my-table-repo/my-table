/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--mt-border))',
        input: 'hsl(var(--mt-input))',
        ring: 'hsl(var(--mt-ring))',
        background: 'hsl(var(--mt-background))',
        foreground: 'hsl(var(--mt-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--mt-primary))',
          foreground: 'hsl(var(--mt-primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--mt-muted))',
          foreground: 'hsl(var(--mt-muted-foreground))',
        },
      },
    },
  },
  plugins: [],
};
