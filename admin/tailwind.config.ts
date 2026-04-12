import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0EEFF',
          100: '#D9D5FF',
          500: '#6C63FF',
          600: '#5A52D5',
          700: '#4842AA',
        },
        tier: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          diamond: '#B9F2FF',
          legend: '#FF4500',
        },
      },
    },
  },
};

export default config;
