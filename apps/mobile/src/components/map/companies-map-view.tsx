import { MapCompanyCallout } from '@/components/map/map-company-callout';
import type { NearbyCompany } from '@/lib/nearby-locations';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';

interface CompaniesMapViewProps {
  companies: NearbyCompany[];
  selectedId: string | null;
  onSelect: (companyId: string | null) => void;
  mapCenter: { latitude: number; longitude: number };
  userLocation?: { latitude: number; longitude: number } | null;
  zoomLevel?: 'near' | 'wide';
  focusKey?: number;
}

function CompanyMarker({
  company,
  selected,
  onPress,
}: {
  company: NearbyCompany;
  selected: boolean;
  onPress: () => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(Boolean(company.logo));

  return (
    <Marker
      coordinate={{ latitude: company.latitude, longitude: company.longitude }}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View
        className={`h-11 w-11 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white shadow-md ${
          selected ? 'border-brand-500' : 'border-white'
        }`}
      >
        {company.logo ? (
          <Image
            source={{ uri: company.logo }}
            className="h-full w-full"
            resizeMode="cover"
            onLoadEnd={() => setTracksViewChanges(false)}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-brand-500">
            <View className="h-3 w-3 rounded-full bg-white" />
          </View>
        )}
      </View>
    </Marker>
  );
}

export function CompaniesMapView({
  companies,
  selectedId,
  onSelect,
  mapCenter,
  userLocation,
  zoomLevel = 'near',
  focusKey = 0,
}: CompaniesMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [calloutPosition, setCalloutPosition] = useState<{ x: number; y: number } | null>(null);

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

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
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
