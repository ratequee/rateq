'use client';

import { useEffect, useState } from 'react';

export const QATAR_CENTER = {
  latitude: 25.3548,
  longitude: 51.1839,
};

export type UserLocationState =
  | { status: 'pending' }
  | { status: 'granted'; latitude: number; longitude: number }
  | { status: 'denied' };

export function useUserLocation(): UserLocationState {
  const [state, setState] = useState<UserLocationState>({ status: 'pending' });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'denied' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'granted',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setState({ status: 'denied' }),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }, []);

  return state;
}
