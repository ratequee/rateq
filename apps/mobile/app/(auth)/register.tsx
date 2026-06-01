import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/api';
import { UserRole } from '@rateq/types';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  Pressable,
} from 'react-native';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>(UserRole.USER);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register({ email: email.trim(), password, role });
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
      <Text className="text-2xl font-bold text-slate-900 mb-6">{t('auth.registerTitle')}</Text>
      <View className="gap-4">
        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">{t('auth.email')}</Text>
          <Input
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Text className="mb-1 text-sm font-medium text-slate-700">{t('auth.password')}</Text>
          <Input value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <View>
          <Text className="mb-2 text-sm font-medium text-slate-700">{t('auth.accountType')}</Text>
          <View className="flex-row gap-2">
            {[UserRole.USER, UserRole.COMPANY].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 rounded-lg border px-3 py-2 ${
                  role === r ? 'border-brand-600 bg-brand-50' : 'border-slate-300'
                }`}
              >
                <Text className="text-center text-sm">
                  {r === UserRole.USER ? t('auth.user') : t('auth.company')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Button title={t('auth.register')} onPress={handleSubmit} loading={loading} />
        <Link href="/(auth)/login" asChild>
          <Button title={t('auth.login')} variant="outline" />
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
