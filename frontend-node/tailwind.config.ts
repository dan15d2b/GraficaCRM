import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: ['./src/**/*.{tsx,ts,jsx,js}', './index.html'],
  theme: {
    extend: {
      colors: {
        // Mist palette - professional blue
      },
    },
  },
  plugins: [],
});