import LogoSvg from '../../../assets/images/logo.svg';
import WhiteLogoSvg from '../../../assets/images/white_logo.svg';
import { useTheme } from '@/context/theme-context';
import { cn } from '@/lib/cn';
import { View } from 'react-native';

interface LogoProps {
  variant?: 'default' | 'light' | 'auto';
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ variant = 'auto', className, width = 110, height = 28 }: LogoProps) {
  const { resolved } = useTheme();
  const useLightLogo = variant === 'light' || (variant === 'auto' && resolved === 'dark');
  const Svg = useLightLogo ? WhiteLogoSvg : LogoSvg;

  return (
    <View className={cn('items-center', className)}>
      <Svg width={width} height={height} />
    </View>
  );
}
