import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #2563EB)',
        'primary-hover': 'var(--color-primary-hover, #1D4ED8)',
        secondary: 'var(--color-secondary, #64748B)',
        accent: 'var(--color-accent, #F59E0B)',
        success: 'var(--color-success, #10B981)',
        warning: 'var(--color-warning, #F59E0B)',
        danger: 'var(--color-danger, #EF4444)',
        background: 'var(--color-background, #F8FAFC)',
        surface: 'var(--color-surface, #FFFFFF)',
        text: 'var(--color-text, #1E293B)',
        'text-muted': 'var(--color-text-muted, #64748B)',
      },
      fontFamily: {
        sans: ['var(--font-family, Inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius-default, 8px)',
        button: 'var(--radius-button, 8px)',
      },
    },
  },
  plugins: [],
};

export default config;
