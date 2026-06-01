import type { Config } from 'tailwindcss';
import preset from '@rateq/config/tailwind/preset';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [preset as Config],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
    },
  },
  plugins: [],
};

export default config;
