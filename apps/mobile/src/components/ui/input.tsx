import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn(
        'h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900',
        className,
      )}
      placeholderTextColor="#94a3b8"
      {...props}
    />
  );
}
