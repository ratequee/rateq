import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.back();
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof ApiError ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white px-6 justify-center"
    >
      <Text className="text-2xl font-bold text-slate-900 mb-6">{t('auth.loginTitle')}</Text>
      <View className="gap-4">
        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">{t('auth.email')}</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">{t('auth.password')}</Text>
          <Input
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>
        <Button title={t('auth.login')} onPress={handleSubmit} loading={loading} />
        <Link href="/(auth)/register" asChild>
          <Button title={t('auth.register')} variant="outline" />
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
