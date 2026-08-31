import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { QATAR_CENTER } from '@/lib/nearby-locations';

export { QATAR_CENTER };

export type UserLocationState =
  | { status: 'pending' }
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' };

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({ status: 'pending' });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        setState({ status: 'denied' });
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;

        setState({
          status: 'granted',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch {
        if (!cancelled) setState({ status: 'denied' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
