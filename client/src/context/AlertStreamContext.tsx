import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from '../types';
import { supabase } from '../lib/supabase';

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

    // 1. Supabase Realtime Subscription (Live Postgres changes)
    const supaChannel = supabase
      .channel('live-alerts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const raw = payload.new as any;
          if (!raw) return;
          const alertData: Alert = {
            id: raw.id,
            disasterId: raw.disaster_id,
            title: raw.title,
            type: raw.type,
            severity: raw.severity,
            status: raw.status,
            targetAreaName: raw.target_area_name,
            targetLatitude: raw.target_latitude,
            targetLongitude: raw.target_longitude,
            targetRadiusKm: raw.target_radius_km,
            headline: raw.headline,
            detailedMessage: raw.detailed_message,
            actionInstructions: raw.action_instructions,
            source: raw.source || 'TRINETRA National Alert System',
            authorId: raw.author_id || 'system',
            issuedAt: raw.issued_at || new Date().toISOString(),
            expiresAt: raw.expires_at || '',
          };
          setLatestLiveAlert(alertData);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    // 2. Local SSE Stream Connection (Express fallback / dual-stream)
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
          } catch (err) {
            console.error('Error handling SSE alert event:', err);
          }
        });

        eventSource.addEventListener('STATUS_PING', () => {
          setIsConnected(true);
        });

        eventSource.onerror = () => {
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
      supabase.removeChannel(supaChannel);
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
