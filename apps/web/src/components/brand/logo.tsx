import Image from 'next/image';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light';
}

export function Logo({ className, variant = 'default' }: LogoProps) {
  return (
    <Image
      src={variant === 'light' ? "/images/white_logo.svg" : "/images/logo.svg"}
      alt="RateQ Logo"
      width={110}
      height={28}
      className={className}
    />
  );
}
