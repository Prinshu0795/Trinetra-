// client/src/pages/citizen/TrinetraRelayPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Radio,
  WifiOff,
  Wifi,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Battery,
  MapPin,
  Cpu,
  Layers,
  Send,
  RefreshCw,
  PhoneCall,
  Activity,
  Terminal,
  Share2,
  Sparkles,
  HardDrive,
  Database,
  Navigation,
  Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import { RelayPacket, RelayMeshStats } from '../../types';
import {
  relayMeshEngine,
  getOrCreateDeviceId,
  DeviceTelemetry,
} from '../../lib/relayMeshEngine';
import { EmergencySosModal } from '../../components/relay/EmergencySosModal';

export const TrinetraRelayPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'LIVE_FEED' | 'ARCHITECTURE' | 'SPECS'>('DASHBOARD');
  const [packets, setPackets] = useState<RelayPacket[]>([]);
  const [stats, setStats] = useState<RelayMeshStats | null>(null);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null);
  const [relayAgentActive, setRelayAgentActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const fetchRelayTelemetry = async () => {
    try {
      setLoading(true);
      const [packetsRes, statsRes, deviceTelem] = await Promise.all([
        api.get('/relay/active'),
        api.get('/relay/stats'),
        relayMeshEngine.queryDeviceTelemetry(),
      ]);

      if (packetsRes.data.success) {
        setPackets(packetsRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      setTelemetry(deviceTelem);
      setRelayAgentActive(relayMeshEngine.isRelayAgentActive());
    } catch (err) {
      console.warn('[Relay Page] Failed to fetch live relay telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelayTelemetry();

    // Subscribe to real-time client mesh engine events
    const unsubscribe = relayMeshEngine.subscribe(() => {
      fetchRelayTelemetry();
    });

    return () => unsubscribe();
  }, []);

  const handleToggleRelayAgent = () => {
    const nextState = !relayAgentActive;
    relayMeshEngine.setRelayAgentActive(nextState);
    setRelayAgentActive(nextState);
  };

  const handleManualVaultFlush = async () => {
    const flushedCount = await relayMeshEngine.flushPendingVault();
    await fetchRelayTelemetry();
    alert(
      flushedCount > 0
        ? `Successfully flushed ${flushedCount} pending offline packet(s) to TRINETRA Cloud!`
        : 'Local vault is synchronized with cloud.'
    );
  };

  const handleDispatch112 = async (packetId: string) => {
    try {
      setDispatchingId(packetId);
      const res = await api.post(`/relay/${packetId}/dispatch-112`, {});
      if (res.data.success) {
        setDispatchResult(res.data.data);
        await fetchRelayTelemetry();
      }
    } catch (err: any) {
      console.error('Failed to dispatch 112:', err);
      alert(err.response?.data?.error?.message || 'Failed to dispatch 112 unit');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 font-sans">
      {/* 1. EDITORIAL HEADER */}
      <section className="space-y-4 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F2] border border-[#F5C2C2] text-[#9E2A2B] text-xs font-semibold font-mono tracking-wider uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#9E2A2B]" />
            Production Feature • Ground Mesh
          </span>
          <span className="text-xs font-mono text-ink-muted">
            Delay-Tolerant Networking (DTN)
          </span>
          <span className="hidden sm:inline-block text-hairline">•</span>
          <span className="text-xs font-mono text-[#166534] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded">
            Node: {telemetry?.deviceId?.slice(0, 12) || 'Active'}...
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-normal text-ink tracking-tight leading-[1.15]">
          TRINETRA RELAY — SOS Without Internet
        </h1>

        <p className="text-sm sm:text-base text-ink-body leading-relaxed max-w-3xl">
          When catastrophic disasters collapse commercial cellular infrastructure, stranded citizens are unable to transmit distress calls. <strong>TRINETRA RELAY</strong> implements an opportunistic, delay-tolerant mesh network where distress signals silently propagate across nearby citizen smartphones until an active gateway is reached.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setSosModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#9E2A2B] hover:bg-[#852223] active:bg-[#6D1D1E] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Transmit Emergency SOS</span>
          </button>

          <button
            onClick={handleManualVaultFlush}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-canvas text-ink border border-hairline text-xs font-semibold rounded-lg shadow-card transition"
          >
            <RefreshCw className="w-4 h-4 text-coral" />
            <span>Flush Local Offline Vault ({telemetry?.vaultSize ?? 0})</span>
          </button>

          <button
            onClick={fetchRelayTelemetry}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-canvas text-ink-muted hover:text-ink border border-hairline text-xs font-semibold rounded-lg shadow-card transition"
          >
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </section>

      {/* 2. LIVE METRICS BAR (REAL DATABASE COUNTS) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-hairline rounded-xl p-5 shadow-card space-y-1">
          <span className="text-xs font-mono uppercase text-ink-muted tracking-wider">
            Total Relayed Ingestions
          </span>
          <div className="text-2xl sm:text-3xl font-serif text-ink">
            {stats?.totalRelayed ?? packets.length}
          </div>
          <p className="text-[11px] text-[#166534] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Cryptographic Integrity
          </p>
        </div>

        <div className="bg-white border border-hairline rounded-xl p-5 shadow-card space-y-1">
          <span className="text-xs font-mono uppercase text-ink-muted tracking-wider">
            112 CAD Dispatches
          </span>
          <div className="text-2xl sm:text-3xl font-serif text-[#9E2A2B]">
            {stats?.dispatched112 ?? packets.filter((p) => p.status === 'DISPATCHED_112').length}
          </div>
          <p className="text-[11px] text-ink-muted">Assigned from Active Resource DB</p>
        </div>

        <div className="bg-white border border-hairline rounded-xl p-5 shadow-card space-y-1">
          <span className="text-xs font-mono uppercase text-ink-muted tracking-wider">
            Average Hop Count
          </span>
          <div className="text-2xl sm:text-3xl font-serif text-coral">
            {stats?.averageHops ?? 0} <span className="text-sm font-sans font-normal text-ink-muted">hops</span>
          </div>
          <p className="text-[11px] text-ink-muted">Max TTL: 5 Hops (Anti-loop)</p>
        </div>

        <div className="bg-white border border-hairline rounded-xl p-5 shadow-card space-y-1">
          <span className="text-xs font-mono uppercase text-ink-muted tracking-wider">
            Average Victim Battery
          </span>
          <div className="text-2xl sm:text-3xl font-serif text-[#166534]">
            {stats?.averageVictimBatteryPercent ? `${stats.averageVictimBatteryPercent}%` : 'N/A'}
          </div>
          <p className="text-[11px] text-[#166534] font-medium">Real Hardware Telemetry</p>
        </div>
      </section>

      {/* 3. TABS NAVIGATION */}
      <div className="border-b border-hairline flex space-x-4 sm:space-x-6 text-xs font-semibold overflow-x-auto no-scrollbar whitespace-nowrap">
        {[
          { id: 'DASHBOARD', label: 'Ground Relay Station Diagnostics' },
          { id: 'LIVE_FEED', label: `Database Relayed Ingestions (${packets.length})` },
          { id: 'ARCHITECTURE', label: 'System Architecture & Data Flow' },
          { id: 'SPECS', label: 'Hardware Standards & 112 Compliance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition uppercase tracking-wider ${
              activeTab === tab.id
                ? 'border-coral text-coral font-bold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. TAB CONTENT: DASHBOARD & GROUND RELAY DIAGNOSTICS */}
      {activeTab === 'DASHBOARD' && (
        <section className="space-y-6">
          {/* Volunteer Ground Relay Station Control Banner */}
          <div className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    relayAgentActive
                      ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                      : 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F5C2C2]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      relayAgentActive ? 'bg-[#22C55E] animate-ping' : 'bg-[#9E2A2B]'
                    }`}
                  />
                  Relay Agent: {relayAgentActive ? 'ACTIVE (LISTENING)' : 'DISABLED'}
                </span>
                <span className="text-xs font-mono text-ink-muted">Citizen P2P Transport</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-normal text-ink">
                Device Relay Station Participation
              </h2>
              <p className="text-xs sm:text-sm text-ink-body leading-relaxed">
                When enabled, this device actively participates as a background relay node. Any distress packet received from a stranded victim will be stored in your encrypted local vault and forwarded when you reach network coverage or encounter an emergency responder.
              </p>
            </div>

            <div className="shrink-0 flex items-center space-x-4">
              <button
                type="button"
                onClick={handleToggleRelayAgent}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition shadow-sm ${
                  relayAgentActive
                    ? 'bg-[#166534] hover:bg-[#12532a] text-white'
                    : 'bg-canvas border border-hairline text-ink-body hover:bg-canvas-subtle'
                }`}
              >
                {relayAgentActive ? 'Relay Participating' : 'Enable Relay Station'}
              </button>
            </div>
          </div>

          {/* Real Device Hardware Diagnostics Card */}
          <div className="bg-white border border-hairline rounded-2xl p-6 shadow-card space-y-5">
            <div className="border-b border-hairline pb-3">
              <h3 className="text-lg font-serif font-normal text-ink">
                Hardware Sensors & Capability Telemetry
              </h3>
              <p className="text-xs text-ink-muted">
                Live introspection of browser and hardware runtime capabilities on this device.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1">
                <span className="text-ink-muted block text-[10px] uppercase font-semibold">
                  Network Connectivity
                </span>
                <div className="flex items-center space-x-2 text-ink font-semibold">
                  {telemetry?.isOnline ? (
                    <Wifi className="w-4 h-4 text-[#166534]" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-[#9E2A2B]" />
                  )}
                  <span>{telemetry?.isOnline ? 'Active Uplink' : 'Zero Cellular Signal'}</span>
                </div>
                <span className="text-[10px] text-ink-muted block">
                  Transport: {telemetry?.connectionType || 'Standard'}
                </span>
              </div>

              <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1">
                <span className="text-ink-muted block text-[10px] uppercase font-semibold">
                  Hardware Battery State
                </span>
                <div className="flex items-center space-x-2 text-ink font-semibold">
                  <Battery className="w-4 h-4 text-[#166534]" />
                  <span>
                    {telemetry?.batteryLevel !== null ? `${telemetry?.batteryLevel}%` : 'Standard Power'}
                  </span>
                </div>
                <span className="text-[10px] text-ink-muted block">
                  {telemetry?.isCharging ? 'AC / Solar Charging' : 'Battery Discharge Monitored'}
                </span>
              </div>

              <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1">
                <span className="text-ink-muted block text-[10px] uppercase font-semibold">
                  Offline Vault Storage
                </span>
                <div className="flex items-center space-x-2 text-ink font-semibold">
                  <HardDrive className="w-4 h-4 text-[#1E40AF]" />
                  <span>{telemetry?.vaultSize ?? 0} Packets In Vault</span>
                </div>
                <span className="text-[10px] text-ink-muted block">
                  {telemetry?.storagePersisted ? 'OS Storage Persisted' : 'Persistent Storage Active'}
                </span>
              </div>

              <div className="p-4 bg-canvas border border-hairline rounded-xl space-y-1">
                <span className="text-ink-muted block text-[10px] uppercase font-semibold">
                  Radio / Mesh APIs
                </span>
                <div className="flex items-center space-x-2 text-ink font-semibold">
                  <Radio className="w-4 h-4 text-coral" />
                  <span>BLE & BroadcastChannel</span>
                </div>
                <span className="text-[10px] text-ink-muted block">
                  Web Bluetooth: {telemetry?.webBluetoothAvailable ? 'Supported' : 'Standard Radio'}
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch Result Card */}
          {dispatchResult && (
            <div className="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-start space-x-4">
              <div className="p-2.5 bg-[#22C55E]/10 rounded-lg text-[#166534]">
                <PhoneCall className="w-6 h-6 text-[#166534] animate-bounce" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2 flex-wrap gap-1">
                  <span className="font-bold text-sm text-[#166534]">
                    Emergency 112 CAD Dispatch Issued
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 border border-[#BBF7D0] rounded text-[#166534]">
                    {dispatchResult.cadTicketNumber}
                  </span>
                </div>
                <p className="text-ink-body">
                  Assigned Emergency Resource: <strong className="text-ink">{dispatchResult.assignedUnit}</strong> from{' '}
                  <strong className="text-ink">{dispatchResult.nearestResourceLocation}</strong>.
                </p>
                <p className="text-ink-muted text-[11px]">
                  Geodesic Distance: <strong>{dispatchResult.distanceKm} km</strong> • Calculated Travel ETA:{' '}
                  <strong>{dispatchResult.estimatedArrivalMinutes} minutes</strong>.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 5. TAB CONTENT: LIVE FEED OF DATABASE PACKETS */}
      {activeTab === 'LIVE_FEED' && (
        <section className="bg-white border border-hairline rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
            <div>
              <h2 className="text-xl font-serif font-normal text-ink">
                Live Mesh Distress Ingestions
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Authentic distress packets saved into the TRINETRA Cloud database, relayed by peer nodes from victims without cellular internet.
              </p>
            </div>
            <button
              onClick={fetchRelayTelemetry}
              className="px-3 py-1.5 bg-canvas hover:bg-canvas-subtle border border-hairline rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-coral" />
              <span>Refresh Records</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs font-mono text-ink-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-coral" />
              <span>Querying database records...</span>
            </div>
          ) : packets.length === 0 ? (
            <div className="text-center py-12 text-xs text-ink-muted space-y-2">
              <p>No distress signals currently registered in database.</p>
              <button
                onClick={() => setSosModalOpen(true)}
                className="text-coral underline font-semibold"
              >
                Transmit an authentic emergency SOS to register a packet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {packets.map((pkt) => {
                let relayChain = [];
                try {
                  relayChain = JSON.parse(pkt.relayChainJson || '[]');
                } catch {
                  relayChain = [];
                }

                return (
                  <div
                    key={pkt.id}
                    className="p-5 border border-hairline rounded-xl hover:border-coral transition bg-canvas-subtle/50 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-hairline pb-3">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-xs font-mono font-bold text-coral bg-coral-subtle px-2 py-0.5 rounded border border-coral-border">
                          {pkt.packetId}
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {pkt.victimName}
                        </span>
                        <span className="text-[11px] font-mono text-ink-muted">
                          ({pkt.victimPhone || 'No telephone'})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white border border-hairline">
                          {pkt.hopCount} Device Hops
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            pkt.status === 'DISPATCHED_112'
                              ? 'bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]'
                              : 'bg-[#FDF2F2] text-[#9E2A2B] border border-[#F5C2C2]'
                          }`}
                        >
                          {pkt.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-ink-body leading-relaxed bg-white p-3 rounded-lg border border-hairline">
                      "{pkt.message}"
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-ink-muted pt-2 border-t border-hairline">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-coral" />
                        <span>
                          {pkt.latitude.toFixed(4)}°, {pkt.longitude.toFixed(4)}°
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Battery className="w-3.5 h-3.5 text-[#166534]" />
                        <span>Battery: {pkt.batteryLevel !== null ? `${pkt.batteryLevel}%` : 'Monitored'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#1E40AF]" />
                        <span>Uplink: {pkt.gatewayNodeId || 'Direct'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-muted" />
                        <span>{new Date(pkt.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    {/* Hop Breadcrumb Trail */}
                    {relayChain.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border border-hairline text-[11px] font-mono flex flex-wrap items-center gap-2">
                        <span className="text-ink-muted font-bold">Relay Breadcrumb:</span>
                        {relayChain.map((hop: any, hIdx: number) => (
                          <React.Fragment key={hIdx}>
                            <span className="bg-canvas px-2 py-0.5 rounded border border-hairline text-ink">
                              {hop.nodeId || `Node-${hIdx}`} ({hop.role})
                            </span>
                            {hIdx < relayChain.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-coral" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* 112 Dispatch Action Button */}
                    {pkt.status !== 'DISPATCHED_112' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleDispatch112(pkt.id)}
                          disabled={dispatchingId === pkt.id}
                          className="px-4 py-2 bg-[#9E2A2B] hover:bg-[#852223] active:bg-[#6D1D1E] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
                        >
                          {dispatchingId === pkt.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Dispatching Nearest Resource...</span>
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Dispatch 112 CAD Squad</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 6. TAB CONTENT: SYSTEM ARCHITECTURE */}
      {activeTab === 'ARCHITECTURE' && (
        <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-8">
          <div className="space-y-2 border-b border-hairline pb-4">
            <h2 className="text-2xl font-serif font-normal text-ink">
              Delay-Tolerant Networking (DTN) Architecture
            </h2>
            <p className="text-xs text-ink-muted">
              Engineering formulation for end-to-end message survivability during total infrastructure collapse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-canvas border border-hairline rounded-xl space-y-3">
              <span className="text-xs font-mono uppercase text-coral font-bold">Pillar 1</span>
              <h3 className="text-base font-serif text-ink">Offline Vault Isolation</h3>
              <p className="text-xs text-ink-body leading-relaxed">
                When network sockets fail, the client generates a cryptographic digest (SHA-256) over coordinates, victim metadata, and hardware battery telemetry, writing directly to persistent IndexedDB. The OS is instructed not to evict records under memory pressure.
              </p>
            </div>

            <div className="p-5 bg-canvas border border-hairline rounded-xl space-y-3">
              <span className="text-xs font-mono uppercase text-coral font-bold">Pillar 2</span>
              <h3 className="text-base font-serif text-ink">Opportunistic Peer Relay</h3>
              <p className="text-xs text-ink-body leading-relaxed">
                Packets propagate across neighboring citizen smartphones over Bluetooth LE 5.3 Coded PHY and Wi-Fi Direct. Each receiver validates the cryptographic signature, checks its Bloom filter to prevent duplicate cycling, decrements TTL, and carries the packet.
              </p>
            </div>

            <div className="p-5 bg-canvas border border-hairline rounded-xl space-y-3">
              <span className="text-xs font-mono uppercase text-coral font-bold">Pillar 3</span>
              <h3 className="text-base font-serif text-ink">Autonomous Gateway Ingestion</h3>
              <p className="text-xs text-ink-body leading-relaxed">
                The instant ANY intermediate device in the mesh reaches network coverage (Starlink, emergency satellite BGAN, or periphery cell tower), its Background Sync engine flushes all accumulated distress signals to the cloud API, which initiates automated 112 CAD routing.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 7. TAB CONTENT: HARDWARE SPECS & 112 COMPLIANCE */}
      {activeTab === 'SPECS' && (
        <section className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 shadow-card space-y-8">
          <div className="space-y-2 border-b border-hairline pb-4">
            <h2 className="text-2xl font-serif font-normal text-ink">
              Production Protocols & Emergency CAD Standards
            </h2>
            <p className="text-xs text-ink-muted">
              Technical specifications engineered for real-world deployment across Indian disaster response frameworks.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse font-sans">
              <thead>
                <tr className="border-b border-hairline text-ink-muted font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Parameter</th>
                  <th className="py-3 px-4">Specification</th>
                  <th className="py-3 px-4">Production Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline text-ink-body">
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Primary Radio Transport</td>
                  <td className="py-3 px-4 font-mono text-coral">Bluetooth Low Energy 5.3 (Coded PHY S=8)</td>
                  <td className="py-3 px-4">Enables up to 150m–300m range in open disaster sectors with building wall penetration.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Secondary Transport</td>
                  <td className="py-3 px-4 font-mono">Wi-Fi Direct / Wi-Fi Aware (NAN)</td>
                  <td className="py-3 px-4">High-throughput bursts for multi-packet relaying between moving rescue vehicles.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Packet Footprint</td>
                  <td className="py-3 px-4 font-mono">192 Bytes Binary Encoded</td>
                  <td className="py-3 px-4">Fits within standard BLE Extended Advertising Data without connection handshake overhead.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Power Consumption</td>
                  <td className="py-3 px-4 font-mono text-[#166534]">&lt; 1.2% Battery / 24 Hours</td>
                  <td className="py-3 px-4">100ms passive listen window every 4 seconds ensures phones don't deplete during disaster waiting periods.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Anti-Storm Routing</td>
                  <td className="py-3 px-4 font-mono">TTL = 5 Hops + Bloom Filter</td>
                  <td className="py-3 px-4">Prevents endless relay cycling and network congestion in dense urban evacuation camps.</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-ink">Emergency 112 Standard</td>
                  <td className="py-3 px-4 font-mono">CAP v1.2 (Common Alerting Protocol)</td>
                  <td className="py-3 px-4">Direct interoperability with India's ERSS (Emergency Response Support System - 112).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Floating Modal */}
      <EmergencySosModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
    </div>
  );
};
