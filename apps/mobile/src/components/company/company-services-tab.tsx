import { getFontFamily } from '@/i18n';
import type { CompanyCatalogLabel } from '@rateq/types';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

interface CompanyServicesTabProps {
  serviceItems: CompanyCatalogLabel[];
  activityItems: CompanyCatalogLabel[];
  services: string[];
}

function BilingualCatalogPill({ labelEn, labelAr }: { labelEn: string; labelAr?: string | null }) {
  const english = labelEn.trim();
  const arabic = labelAr?.trim();
  const showBoth = Boolean(arabic && arabic !== english);

  return (
    <View className="rounded-full border border-slate-200 bg-slate-100 px-4 py-3 dark:border-dm-border dark:bg-dm-elevated">
      <Text
        className="text-sm font-medium text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('medium', english), lineHeight: 20 }}
      >
        {english}
      </Text>
      {showBoth ? (
        <Text
          className="mt-1.5 text-ink-muted dark:text-white/70"
          style={{
            fontFamily: getFontFamily('regular', arabic!),
            writingDirection: 'rtl',
            fontSize: 11,
            lineHeight: 18,
          }}
        >
          {arabic}
        </Text>
      ) : null}
    </View>
  );
}

function CatalogPills({
  title,
  items,
  legacyLabels,
}: {
  title: string;
  items: CompanyCatalogLabel[];
  legacyLabels?: string[];
}) {
  const hasItems = items.length > 0 || (legacyLabels?.length ?? 0) > 0;
  if (!hasItems) return null;

  return (
    <View className="mb-6">
      <Text
        className="mb-3 text-sm font-semibold text-ink dark:text-white"
        style={{ fontFamily: getFontFamily('semibold'), lineHeight: 20 }}
      >
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {items.map((item) => (
          <BilingualCatalogPill key={item.id} labelEn={item.label} labelAr={item.labelAr} />
        ))}
        {legacyLabels?.map((label, index) => (
          <BilingualCatalogPill key={`${label}-${index}`} labelEn={label} />
        ))}
      </View>
    </View>
  );
}

export function CompanyServicesTab({
  serviceItems,
  activityItems,
  services,
}: CompanyServicesTabProps) {
  const { t } = useTranslation();

  const hasCatalog = serviceItems.length > 0 || activityItems.length > 0;
  const hasLegacy = services.length > 0;

  if (!hasCatalog && !hasLegacy) {
    return (
      <Text
        className="py-12 text-center text-sm text-ink-muted dark:text-white/70"
        style={{ fontFamily: getFontFamily('regular') }}
      >
        {t('company.noServices')}
      </Text>
    );
  }

  return (
    <View>
      <CatalogPills
        title={t('company.servicesTitle')}
        items={serviceItems}
        legacyLabels={hasCatalog ? undefined : services}
      />
      <CatalogPills title={t('company.activitiesTitle')} items={activityItems} />
    </View>
  );
}
