// client/src/hooks/useGeolocation.ts
import { useLocationContext } from '../context/LocationContext';

export function useGeolocation() {
  const { latitude, longitude, accuracy, gpsLoading, gpsError, refreshGps } = useLocationContext();

  return {
    latitude,
    longitude,
    accuracy,
    error: gpsError,
    loading: gpsLoading,
    refetchLocation: refreshGps,
  };
}
