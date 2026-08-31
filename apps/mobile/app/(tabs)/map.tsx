import { CompaniesMapView } from '@/components/map/companies-map-view';
import { MapViewToggle, type MapScreenView } from '@/components/map/map-view-toggle';
import { NearbyCompanyListCard } from '@/components/map/nearby-company-list-card';
import { Input } from '@/components/ui/input';
import { LoadingView } from '@/components/ui/loading-view';
import { useUserLocation } from '@/hooks/use-user-location';
import { useAppDirection } from '@/hooks/use-app-direction';
import { getFontFamily } from '@/i18n';
import { ApiError, companiesApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import { enrichCompaniesWithNearbyLocations, type NearbyCompany } from '@/lib/nearby-locations';
import type { CompanyPublic } from '@rateq/types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Keyboard, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function filterNearbyCompanies(companies: NearbyCompany[], searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return companies;

  return companies.filter((company) => {
    const name = company.name.toLowerCase();
    const nameAr = company.nameAr?.toLowerCase() ?? '';
    const categoryEn = company.categoryName?.toLowerCase() ?? '';
    const categoryAr = company.categoryNameAr?.toLowerCase() ?? '';
    const city = company.city.toLowerCase();
    return (
      name.includes(normalized) ||
      nameAr.includes(normalized) ||
      categoryEn.includes(normalized) ||
      categoryAr.includes(normalized) ||
      city.includes(normalized)
    );
  });
}

export default function MapScreen() {
  const { t } = useTranslation();
  const { textStyle, textAlignClass } = useAppDirection();
  const userLocation = useUserLocation();

  const [view, setView] = useState<MapScreenView>('map');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapFocusKey, setMapFocusKey] = useState(0);
  const prevViewRef = useRef<MapScreenView>(view);

  const load = useCallback(async () => {
    try {
      setError(null);
      const result = await companiesApi.search(
        new URLSearchParams({ sort: 'rating', limit: '50' }),
      );
      setCompanies(result.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    }
  }, [t]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const useQatarFallback = userLocation.status !== 'granted';

  const origin = useMemo(() => {
    if (userLocation.status === 'granted') {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }
    return {
      latitude: 25.2854,
      longitude: 51.531,
    };
  }, [userLocation]);

  const nearbyCompanies = useMemo(
    () =>
      enrichCompaniesWithNearbyLocations(companies, origin, {
        qatarOnly: useQatarFallback,
      }),
    [companies, origin, useQatarFallback],
  );

  const filteredCompanies = useMemo(
    () => filterNearbyCompanies(nearbyCompanies, appliedQuery),
    [nearbyCompanies, appliedQuery],
  );

  useEffect(() => {
    if (selectedId && !filteredCompanies.some((company) => company.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredCompanies, selectedId]);

  const focusMapOnFirstMatch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSelectedId(null);
        return;
      }

      const matches = filterNearbyCompanies(nearbyCompanies, searchQuery);
      setSelectedId(matches[0]?.id ?? null);
      setMapFocusKey((key) => key + 1);
    },
    [nearbyCompanies],
  );

  useEffect(() => {
    const switchedToMap = prevViewRef.current !== 'map' && view === 'map';
    prevViewRef.current = view;

    if (switchedToMap && appliedQuery.trim()) {
      focusMapOnFirstMatch(appliedQuery);
    }
  }, [view, appliedQuery, focusMapOnFirstMatch]);

  const onSearch = () => {
    Keyboard.dismiss();
    setAppliedQuery(query);

    if (view === 'map') {
      focusMapOnFirstMatch(query);
    }
  };

  const locationHint =
    userLocation.status === 'pending'
      ? t('map.locating')
      : userLocation.status === 'denied'
        ? t('map.qatarFallback')
        : t('map.usingYourLocation');

  if (loading) return <LoadingView />;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-dm-bg" edges={['top']}>
      <MapViewToggle value={view} onChange={setView} />

      {view === 'map' ? (
        <View className="relative flex-1">
          <CompaniesMapView
            companies={filteredCompanies}
            selectedId={selectedId}
            onSelect={setSelectedId}
            mapCenter={origin}
            userLocation={userLocation.status === 'granted' ? origin : null}
            zoomLevel={userLocation.status === 'granted' ? 'near' : 'wide'}
            focusKey={mapFocusKey}
          />

          <View className="absolute left-4 right-4 top-4">
            <View className="flex-row items-center gap-2">
              <Input
                className="flex-1 rounded-full border-0 bg-white shadow-md"
                placeholder={t('map.searchPlaceholder')}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={onSearch}
                returnKeyType="search"
              />
              <Pressable
                onPress={onSearch}
                className="h-12 w-12 items-center justify-center rounded-full bg-brand-500 shadow-md"
              >
                <Ionicons name="search" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 bg-slate-50 dark:bg-dm-bg">
          <Text
            className={cn(
              'px-4 pb-2 pt-4 text-sm text-ink-muted dark:text-white/75',
              textAlignClass,
            )}
            style={[{ fontFamily: getFontFamily('regular') }, textStyle]}
          >
            {t('map.companiesByDistance')}
          </Text>

          {error ? (
            <Text className="px-4 py-2 text-center text-sm text-red-600">{error}</Text>
          ) : null}

          <FlatList
            data={filteredCompanies}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <View className="pb-3">
                <View className="flex-row items-center gap-2">
                  <Input
                    className="flex-1 rounded-full border-slate-200 bg-white"
                    placeholder={t('map.searchPlaceholder')}
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={onSearch}
                    returnKeyType="search"
                  />
                  <Pressable
                    onPress={onSearch}
                    className="h-12 w-12 items-center justify-center rounded-full bg-brand-500"
                  >
                    <Ionicons name="search" size={20} color="#ffffff" />
                  </Pressable>
                </View>
                <Text
                  className={cn('mt-2 text-xs text-ink-muted dark:text-white/60', textAlignClass)}
                  style={[{ fontFamily: getFontFamily('regular') }, textStyle]}
                >
                  {locationHint}
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text className="py-12 text-center text-sm text-ink-muted dark:text-white/70">
                {t('map.noResults')}
              </Text>
            }
            renderItem={({ item }) => <NearbyCompanyListCard company={item} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
