// client/src/pages/citizen/ResourcesPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import api from '../../lib/api';
import { EmergencyResource } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useGeolocation } from '../../hooks/useGeolocation';
import { supabase, isSupabaseConfigured, supabaseGetResources } from '../../lib/supabase';

export const ResourcesPage: React.FC = () => {
  const { latitude, longitude } = useGeolocation();
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [scope, setScope] = useState<'ALL_INDIA' | 'NEARBY'>('ALL_INDIA');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        let loadedResources: EmergencyResource[] = [];

        // 1. Fetch live emergency resources directly from Supabase
        if (isSupabaseConfigured) {
          try {
            const supaRes = await supabaseGetResources();
            if (supaRes?.length) {
              loadedResources = supaRes as any;
            }
          } catch (supaErr) {
            console.warn('Direct Supabase resources notice:', supaErr);
          }
        }

        // 2. Fallback to Express backend if needed
        if (!loadedResources.length) {
          const endpoint =
            scope === 'NEARBY' && latitude && longitude
              ? `/resources?lat=${latitude}&lng=${longitude}&live=true`
              : '/resources';
          const res = await api.get(endpoint);
          if (res.data.success) {
            loadedResources = res.data.data;
          }
        }

        setResources(loadedResources);
      } catch (err) {
        console.error('Failed to load emergency resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();

    // Live Realtime Subscription for emergency resources
    const resChannel = supabase
      .channel('resources-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_resources' }, () => {
        supabaseGetResources().then((r) => setResources(r as any)).catch(() => {});
      })
      .subscribe();

    return () => {
      supabase.removeChannel(resChannel);
    };
  }, [latitude, longitude, scope]);

  const categories = [
    { key: 'ALL', label: 'All Resources' },
    { key: 'HOSPITAL', label: 'Hospitals & Medical' },
    { key: 'NDRF_UNIT', label: 'NDRF Water Rescue' },
    { key: 'FIRE_STATION', label: 'Fire & Rescue Squads' },
  ];

  const filtered = resources.filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return r.category === selectedCategory;
  });

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-normal text-ink flex items-center gap-2">
            <Building2 className="w-5 h-5 text-coral shrink-0" />
            <span>Emergency Facilities & Critical Resources</span>
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Direct directory of operational Level-1 trauma centers, NDRF boat rescue bases, and de-watering pump squads across all Indian states.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setScope('ALL_INDIA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              scope === 'ALL_INDIA'
                ? 'bg-coral text-white border-coral shadow-sm'
                : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
            }`}
          >
            🇮🇳 Whole India
          </button>
          <button
            type="button"
            onClick={() => setScope('NEARBY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              scope === 'NEARBY'
                ? 'bg-coral text-white border-coral shadow-sm'
                : 'bg-white hover:bg-canvas text-ink border-hairline shadow-card'
            }`}
          >
            📍 Near My GPS
          </button>
        </div>
      </div>

      {/* Category Tabs (Horizontal scrollable on mobile) */}
      <div className="flex space-x-1.5 border-b border-hairline pb-3 overflow-x-auto no-scrollbar text-xs font-semibold py-0.5">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              selectedCategory === cat.key
                ? 'bg-coral text-white shadow-sm'
                : 'bg-white hover:bg-canvas text-ink-muted hover:text-ink border border-hairline'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-ink-muted">Loading emergency logistics...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((resItem) => {
            let suppliesObj: any = null;
            if (resItem.supplies) {
              try {
                suppliesObj = JSON.parse(resItem.supplies);
              } catch {}
            }

            return (
              <div
                key={resItem.id}
                className="bg-white border border-hairline rounded-xl p-5 shadow-card hover:border-hairline transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-coral uppercase tracking-wider">
                        {resItem.category.replace(/_/g, ' ')}
                      </span>
                      <h3 className="text-base font-semibold text-ink leading-tight mt-0.5">{resItem.name}</h3>
                      <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                        <span>{resItem.locationName}</span>
                      </p>
                    </div>
                    <Badge status={resItem.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {resItem.distanceKm !== undefined && (
                      <span
                        className={`inline-block border px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                          resItem.distanceKm < 15
                            ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]'
                            : 'bg-canvas border-hairline text-[#1E40AF]'
                        }`}
                      >
                        📍 {resItem.distanceKm} km away
                      </span>
                    )}
                    {resItem.source?.includes('OPENSTREETMAP') && (
                      <span className="inline-block bg-[#EFF6FF] border border-[#BFDBFE] px-1.5 py-0.5 rounded text-[10px] text-[#1E40AF] font-mono">
                        Live OSM
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink-body leading-relaxed bg-canvas p-3 rounded-lg border border-hairline">
                    {resItem.details}
                  </p>

                  {/* Supplies Checklist */}
                  {suppliesObj && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1 font-mono">
                        <Package className="w-3.5 h-3.5 text-coral" />
                        Verified Active Inventory
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(suppliesObj).map(([k, v]) => (
                          <div
                            key={k}
                            className="bg-canvas border border-hairline p-2 rounded-lg text-ink-body"
                          >
                            <span className="text-[10px] text-ink-subtle block capitalize font-sans">
                              {k.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="font-semibold text-ink">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Dial Action */}
                <div className="pt-3 border-t border-hairline">
                  <a
                    href={`tel:${resItem.contactNumber}`}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-coral hover:bg-coral-hover active:bg-coral-active text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Helpline ({resItem.contactNumber})</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
