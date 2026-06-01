import localFont from 'next/font/local';

export const avenirNextRounded = localFont({
  src: [
    {
      path: '../../public/fonts/AvenirNextRoundedPro-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AvenirNextRoundedPro-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AvenirNextRoundedPro-Demi.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/AvenirNextRoundedPro-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-avenir',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});
