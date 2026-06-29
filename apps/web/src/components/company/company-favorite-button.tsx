'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { companiesApi } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CompanyFavoriteButtonProps {
  companyId: string;
  slug: string;
  initialFavorited?: boolean;
  className?: string;
}

export function CompanyFavoriteButton({
  companyId,
  slug,
  initialFavorited = false,
  className,
}: CompanyFavoriteButtonProps) {
  const t = useTranslations('companyPage');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (!user || initialFavorited) return;
    let cancelled = false;
    void companiesApi
      .getBySlugClient(slug)
      .then((company) => {
        if (!cancelled && company.isFavorited) setFavorited(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, slug, initialFavorited]);

  const toggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setActing(true);
    try {
      if (favorited) {
        await companiesApi.removeFavorite(companyId);
        setFavorited(false);
        toast.success(t('favoriteRemoved'));
      } else {
        await companiesApi.addFavorite(companyId);
        setFavorited(true);
        toast.success(t('favoriteAdded'));
      }
    } catch {
      toast.error(t('favoriteError'));
    } finally {
      setActing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={acting || isLoading}
      aria-pressed={favorited}
      aria-label={favorited ? t('removeFavorite') : t('addFavorite')}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border border-default px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:hover:bg-dm-elevated',
        className,
      )}
    >
      <Heart
        className={cn('h-4 w-4', favorited ? 'fill-brand-500 text-brand-500' : 'text-secondary')}
      />
      {favorited ? t('saved') : t('saveFavorite')}
    </button>
  );
}
