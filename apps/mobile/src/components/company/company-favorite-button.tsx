import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/hooks/use-app-toast';
import { companiesApi } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable } from 'react-native';

interface CompanyFavoriteButtonProps {
  companyId: string;
  initialFavorited?: boolean;
  className?: string;
}

export function CompanyFavoriteButton({
  companyId,
  initialFavorited = false,
  className,
}: CompanyFavoriteButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useAppToast();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const toggle = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }

    setActing(true);
    try {
      if (favorited) {
        await companiesApi.removeFavorite(companyId);
        setFavorited(false);
        toast.success(t('company.favoriteRemoved'));
      } else {
        await companiesApi.addFavorite(companyId);
        setFavorited(true);
        toast.success(t('company.favoriteAdded'));
      }
    } catch (err) {
      toast.apiError(err, t('company.favoriteError'));
    } finally {
      setActing(false);
    }
  };

  return (
    <Pressable
      onPress={() => void toggle()}
      disabled={acting}
      accessibilityRole="button"
      accessibilityLabel={favorited ? t('company.removeFavorite') : t('company.addFavorite')}
      accessibilityState={{ selected: favorited, disabled: acting }}
      className={`h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ${className ?? ''}`}
    >
      {acting ? (
        <ActivityIndicator size="small" color="#8E2157" />
      ) : (
        <Ionicons
          name={favorited ? 'heart' : 'heart-outline'}
          size={22}
          color={favorited ? '#8E2157' : '#64748b'}
        />
      )}
    </Pressable>
  );
}
