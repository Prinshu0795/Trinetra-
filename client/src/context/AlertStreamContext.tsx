// client/src/context/AlertStreamContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from '../types';
import { alertAudio } from '../lib/audio';

interface AlertStreamContextType {
  latestLiveAlert: Alert | null;
  isConnected: boolean;
  clearLatestAlert: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
}

const AlertStreamContext = createContext<AlertStreamContextType | undefined>(undefined);

export const AlertStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latestLiveAlert, setLatestLiveAlert] = useState<Alert | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/v1/alerts/stream');

        eventSource.onopen = () => {
          setIsConnected(true);
        };

        eventSource.addEventListener('ALERT_PUBLISHED', (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            const alertData: Alert = parsed.data;
            setLatestLiveAlert(alertData);

            if (audioEnabled) {
              if (alertData.severity === 'CRITICAL' || alertData.severity === 'HIGH') {
                alertAudio.playEmergencyTone();
              } else {
                alertAudio.playNotificationPing();
              }
            }
          } catch (err) {
            console.error('Error handling SSE alert event:', err);
          }
        });

        eventSource.addEventListener('STATUS_PING', () => {
          setIsConnected(true);
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          if (eventSource) {
            eventSource.close();
          }
          // Retry connection after 5 seconds
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        console.error('SSE initialization error:', err);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [audioEnabled]);

  const clearLatestAlert = () => setLatestLiveAlert(null);

  return (
    <AlertStreamContext.Provider
      value={{
        latestLiveAlert,
        isConnected,
        clearLatestAlert,
        audioEnabled,
        setAudioEnabled,
      }}
    >
      {children}
    </AlertStreamContext.Provider>
  );
};

export const useAlertStream = (): AlertStreamContextType => {
  const context = useContext(AlertStreamContext);
  if (!context) {
    throw new Error('useAlertStream must be used within an AlertStreamProvider');
  }
  return context;
};
