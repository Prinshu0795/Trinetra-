// client/src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

// Default demonstration location: Guwahati, Assam (SIH Brahmaputra scenario)
const DEFAULT_COORDS = {
  latitude: 26.1445,
  longitude: 91.7362,
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: DEFAULT_COORDS.latitude,
    longitude: DEFAULT_COORDS.longitude,
    accuracy: null,
    error: null,
    loading: false,
  });

  const getPosition = () => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        console.warn('Geolocation failed or permission denied, using scenario fallback:', error.message);
        setState({
          latitude: DEFAULT_COORDS.latitude,
          longitude: DEFAULT_COORDS.longitude,
          accuracy: null,
          error: error.message,
          loading: false,
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    // Initial fetch
    getPosition();
  }, []);

  return {
    ...state,
    refetchLocation: getPosition,
  };
}
