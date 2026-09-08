import { MapCompanyCallout } from '@/components/map/map-company-callout';
import { isNativeGoogleMapsConfigured } from '@/lib/maps/is-native-google-maps-configured';
import { getMapMarkerLogoUri } from '../../lib/maps/marker-logo';
import type { NearbyCompany } from '@/lib/nearby-locations';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

const MARKER_SIZE = 40;
const MARKER_BORDER = 3;
const TRACK_SETTLE_MS = Platform.OS === 'android' ? 500 : 200;

interface CompaniesMapViewProps {
  companies: NearbyCompany[];
  selectedId: string | null;
  onSelect: (companyId: string | null) => void;
  mapCenter: { latitude: number; longitude: number };
  userLocation?: { latitude: number; longitude: number } | null;
  zoomLevel?: 'near' | 'wide';
  focusKey?: number;
  markerRefreshKey?: number;
}

function CompanyMarker({
  company,
  selected,
  onPress,
  refreshKey,
}: {
  company: NearbyCompany;
  selected: boolean;
  onPress: () => void;
  refreshKey: number;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirstSelectionPass = useRef(true);

  const settleAfterPaint = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    setTracksViewChanges(true);
    settleTimer.current = setTimeout(() => {
      setTracksViewChanges(false);
    }, TRACK_SETTLE_MS);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLogoUri(null);
    setTracksViewChanges(true);

    if (!company.logo) {
      settleAfterPaint();
      return () => {
        cancelled = true;
        if (settleTimer.current) clearTimeout(settleTimer.current);
      };
    }

    void getMapMarkerLogoUri(company.logo).then((uri) => {
      if (!cancelled) {
        setLogoUri(uri);
        if (!uri) settleAfterPaint();
      }
    });

    return () => {
      cancelled = true;
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [company.logo, refreshKey, settleAfterPaint]);

  useEffect(() => {
    if (skipFirstSelectionPass.current) {
      skipFirstSelectionPass.current = false;
      return;
    }
    setTracksViewChanges(true);
    settleAfterPaint();
  }, [selected, settleAfterPaint]);

  const coordinate = { latitude: company.latitude, longitude: company.longitude };
  const borderColor = selected ? '#8E2157' : '#FFFFFF';

  // Image must be the Marker's direct child on Android (Fabric) so the native
  // snapshot includes the bitmap. Nested Image→View wrappers often stay blank.
  if (logoUri) {
    return (
      <Marker
        coordinate={coordinate}
        onPress={onPress}
        tracksViewChanges={tracksViewChanges}
        anchor={{ x: 0.5, y: 0.5 }}
        zIndex={selected ? 10 : 1}
      >
        <Image
          key={`${company.id}-${refreshKey}-${logoUri}`}
          source={{ uri: logoUri }}
          style={[styles.markerAvatar, { borderColor }]}
          resizeMode="cover"
          fadeDuration={0}
          onLoad={settleAfterPaint}
          onError={settleAfterPaint}
        />
      </Marker>
    );
  }

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={selected ? 10 : 1}
    >
      <View style={[styles.markerFallback, { borderColor }]}>
        <Text style={styles.markerFallbackLetter}>
          {(company.name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerAvatar: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: MARKER_BORDER,
    backgroundColor: '#FFFFFF',
  },
  markerFallback: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    borderWidth: MARKER_BORDER,
    backgroundColor: '#8E2157',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerFallbackLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export function CompaniesMapView({
  companies,
  selectedId,
  onSelect,
  mapCenter,
  userLocation,
  zoomLevel = 'near',
  focusKey = 0,
  markerRefreshKey = 0,
}: CompaniesMapViewProps) {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const [calloutPosition, setCalloutPosition] = useState<{ x: number; y: number } | null>(null);
  const mapsReady = isNativeGoogleMapsConfigured();

  const selected = companies.find((company) => company.id === selectedId) ?? null;

  const initialRegion: Region = {
    latitude: mapCenter.latitude,
    longitude: mapCenter.longitude,
    latitudeDelta: zoomLevel === 'near' ? 0.08 : 0.35,
    longitudeDelta: zoomLevel === 'near' ? 0.08 : 0.35,
  };

  const updateCalloutPosition = useCallback(async () => {
    if (!selected || !mapRef.current) {
      setCalloutPosition(null);
      return;
    }

    try {
      const point = await mapRef.current.pointForCoordinate({
        latitude: selected.latitude,
        longitude: selected.longitude,
      });
      setCalloutPosition(point);
    } catch {
      setCalloutPosition(null);
    }
  }, [selected]);

  useEffect(() => {
    void updateCalloutPosition();
  }, [updateCalloutPosition]);

  useEffect(() => {
    if (!selected || !mapRef.current) return;

    void mapRef.current.animateToRegion(
      {
        latitude: selected.latitude,
        longitude: selected.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      },
      250,
    );
  }, [selected?.id, focusKey]);

  if (!mapsReady) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100 px-6 dark:bg-dm-bg">
        <Text className="text-center text-base font-semibold text-ink dark:text-white">
          {t('map.mapsUnavailableTitle')}
        </Text>
        <Text className="mt-2 text-center text-sm leading-relaxed text-ink-muted dark:text-white/70">
          {t('map.mapsUnavailableBody')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation={Platform.OS === 'ios'}
        showsMyLocationButton={false}
        onRegionChangeComplete={() => {
          void updateCalloutPosition();
        }}
        onLayout={() => {
          void updateCalloutPosition();
        }}
      >
        {userLocation ? (
          <Circle
            center={userLocation}
            radius={40}
            fillColor="rgba(34, 197, 94, 0.25)"
            strokeColor="#22c55e"
            strokeWidth={2}
          />
        ) : null}

        {companies.map((company) => (
          <CompanyMarker
            key={company.id}
            company={company}
            selected={company.id === selectedId}
            refreshKey={markerRefreshKey}
            onPress={() => onSelect(company.id === selectedId ? null : company.id)}
          />
        ))}
      </MapView>

      {selected && calloutPosition ? (
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0"
          style={{
            top: Math.max(12, calloutPosition.y - 190),
            paddingHorizontal: 16,
          }}
        >
          <MapCompanyCallout company={selected} onClose={() => onSelect(null)} />
        </View>
      ) : null}
    </View>
  );
}
