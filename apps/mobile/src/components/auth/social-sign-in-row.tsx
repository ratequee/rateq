import { View } from 'react-native';
import { AppleSignInButton } from '@/components/auth/apple-sign-in-button';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';

export function SocialSignInRow() {
  return (
    <View className="flex-row items-center justify-center gap-5">
      <GoogleSignInButton />
      <AppleSignInButton />
    </View>
  );
}
