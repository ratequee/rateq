import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/input';
import type { AccountLinkingRequiredError } from '@/lib/auth-flow-errors';
import { getFontFamily } from '@/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AccountLinkingDialogProps {
  request: AccountLinkingRequiredError | null;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => void | Promise<void>;
}

export function AccountLinkingDialog({
  request,
  loading = false,
  onCancel,
  onSubmit,
}: AccountLinkingDialogProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');

  if (!request) {
    return null;
  }

  const provider =
    request.providerLabel === 'Apple' ? t('auth.continueWithApple') : t('auth.continueWithGoogle');

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleCancel}>
      <Pressable className="flex-1 justify-end bg-black/50" onPress={handleCancel}>
        <Pressable
          className="rounded-t-3xl bg-white px-5 pt-5 dark:bg-dm-surface"
          style={{ paddingBottom: Math.max(insets.bottom, 20) }}
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-white/20" />
          </View>

          <Text
            className="text-lg font-bold text-ink dark:text-white"
            style={{ fontFamily: getFontFamily('bold') }}
          >
            {t('auth.linkAccountTitle')}
          </Text>
          <Text
            className="mt-2 text-sm text-ink-muted dark:text-white/75"
            style={{ fontFamily: getFontFamily('regular') }}
          >
            {t('auth.linkAccountMessage', { email: request.email, provider })}
          </Text>

          <View className="mt-5">
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              autoComplete="password"
              placeholder={t('auth.passwordPlaceholder')}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50 dark:border-dm-border dark:bg-dm-elevated"
              toggleLabels={{
                show: t('auth.showPassword'),
                hide: t('auth.hidePassword'),
              }}
            />
          </View>

          <View className="mt-6 flex-row gap-3">
            <Button
              title={t('auth.linkAccountCancel')}
              variant="outline"
              className="flex-1 rounded-2xl"
              onPress={handleCancel}
              disabled={loading}
            />
            <Button
              title={t('auth.linkAccountSubmit')}
              variant="gold"
              className="flex-1 rounded-2xl"
              loading={loading}
              disabled={!password.trim()}
              onPress={() => void onSubmit(password)}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
