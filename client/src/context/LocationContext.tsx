// client/src/context/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface LocationContextType {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  gpsLoading: boolean;
  gpsError: string | null;
  refreshGps: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
  }>({
    latitude: null,
    longitude: null,
    accuracy: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrowserGps = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('[LocationContext] GPS error:', err.message);
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    localStorage.removeItem('trinetra_location_mode');
    localStorage.removeItem('trinetra_location_preset');
    fetchBrowserGps();
  }, [fetchBrowserGps]);

  return (
    <LocationContext.Provider
      value={{
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        gpsLoading: loading,
        gpsError: error,
        refreshGps: fetchBrowserGps,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
}
