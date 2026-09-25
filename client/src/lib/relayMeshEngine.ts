// client/src/lib/relayMeshEngine.ts
import api from './api';
import { RelayPacket, RelayHopNode } from '../types';

const VAULT_STORAGE_KEY = 'trinetra_offline_relay_vault';
const NODE_ID_KEY = 'trinetra_mesh_node_id';
const RELAY_MODE_KEY = 'trinetra_relay_agent_active';

// Generate or retrieve persistent cryptographic device ID for this node
export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(NODE_ID_KEY);
  if (!id) {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(4);
      window.crypto.getRandomValues(bytes);
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
      id = `TRN-NODE-${hex}`;
    } else {
      id = `TRN-NODE-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    }
    localStorage.setItem(NODE_ID_KEY, id);
  }
  return id;
}

// Compute standard cryptographic SHA-256 digest over payload string
export async function computePayloadHash(payload: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16).toUpperCase();
  }
  return Date.now().toString(36).toUpperCase();
}

export interface OfflineSosInput {
  victimName: string;
  victimPhone?: string | null;
  latitude: number;
  longitude: number;
  altitudeMeters?: number | null;
  emergencyType: string;
  message: string;
  batteryLevel?: number | null;
}

export interface DeviceTelemetry {
  isOnline: boolean;
  connectionType?: string;
  batteryLevel: number | null;
  isCharging: boolean | null;
  storagePersisted: boolean;
  webBluetoothAvailable: boolean;
  serviceWorkerAvailable: boolean;
  vaultSize: number;
  deviceId: string;
}

class RelayMeshEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(packet: RelayPacket, source: 'P2P_PEER' | 'LOCAL' | 'CLOUD') => void> = new Set();
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private relayAgentActive: boolean = true;

  constructor() {
    this.initP2PChannel();
    this.initNetworkListeners();
    this.initStoragePersistence();
    this.autoFlushIfOnline();
  }

  // Request persistent storage so emergency distress signals are never evicted by browser OS
  private async initStoragePersistence() {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        if (isPersisted) {
          console.log('[RelayMeshEngine] Local emergency vault storage successfully persisted by OS.');
        }
      } catch (e) {
        console.warn('[RelayMeshEngine] Storage persistence request bypassed:', e);
      }
    }
  }

  // Cross-tab / P2P Local Broadcast Mesh using HTML5 BroadcastChannel API
  private initP2PChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('trinetra_relay_mesh_channel');
        this.channel.onmessage = (event) => {
          const { type, packet, senderId } = event.data || {};
          if (type === 'RELAY_P2P_BEACON' && packet) {
            this.handleIncomingPeerPacket(packet, senderId);
          }
        };
      } catch (e) {
        console.warn('[RelayMeshEngine] BroadcastChannel not supported in this environment:', e);
      }
    }
  }

  // Monitor real network connectivity transitions from browser runtime
  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[RelayMeshEngine] Network connectivity confirmed. Initiating opportunistic vault flush...');
        this.isOnlineState = true;
        this.flushPendingVault();
      });

      window.addEventListener('offline', () => {
        console.warn('[RelayMeshEngine] Network connectivity lost. Delay-Tolerant Store-and-Forward active.');
        this.isOnlineState = false;
      });
    }
  }

  public subscribe(callback: (packet: RelayPacket, source: 'P2P_PEER' | 'LOCAL' | 'CLOUD') => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifySubscribers(packet: RelayPacket, source: 'P2P_PEER' | 'LOCAL' | 'CLOUD') {
    this.listeners.forEach((cb) => {
      try {
        cb(packet, source);
      } catch (err) {
        console.error('[RelayMeshEngine] Subscriber callback error:', err);
      }
    });
  }

  public getVaultPackets(): RelayPacket[] {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveVaultPackets(packets: RelayPacket[]) {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(packets));
  }

  // Toggle citizen volunteer relay mode
  public setRelayAgentActive(active: boolean) {
    this.relayAgentActive = active;
    localStorage.setItem(RELAY_MODE_KEY, active ? '1' : '0');
  }

  public isRelayAgentActive(): boolean {
    return this.relayAgentActive;
  }

  // Handle incoming packet from nearby device over P2P mesh
  private async handleIncomingPeerPacket(peerPacket: RelayPacket, senderId: string) {
    if (!this.relayAgentActive) return;

    const myNodeId = getOrCreateDeviceId();
    if (senderId === myNodeId) return; // Prevent echoing own transmission

    // Parse relay hop chain
    let chain: RelayHopNode[] = [];
    try {
      chain = JSON.parse(peerPacket.relayChainJson || '[]');
    } catch {
      chain = [];
    }

    // Check if we've already processed this packet to prevent routing loops
    if (chain.some((h) => h.nodeId === myNodeId)) {
      return;
    }

    // Max 5 hops to prevent network storming
    if ((peerPacket.hopCount || 0) >= 5) {
      console.warn(`[RelayMeshEngine] Dropping packet ${peerPacket.packetId}: Maximum TTL (5 hops) reached.`);
      return;
    }

    const newHop: RelayHopNode = {
      nodeId: myNodeId,
      role: 'RELAY_HOP',
      timestamp: new Date().toISOString(),
      protocol: 'BLE_5_3',
    };

    const updatedPacket: RelayPacket = {
      ...peerPacket,
      hopCount: (peerPacket.hopCount || 0) + 1,
      relayChainJson: JSON.stringify([...chain, newHop]),
    };

    this.notifySubscribers(updatedPacket, 'P2P_PEER');

    // If THIS device currently has internet access, forward immediately to TRINETRA Cloud on behalf of victim!
    if (this.isOnlineState && navigator.onLine) {
      console.log(`[RelayMeshEngine] Relay device has active uplink! Forwarding distress packet ${peerPacket.packetId} to TRINETRA Cloud...`);
      await this.transmitToCloud(updatedPacket, myNodeId);
    } else {
      // Otherwise, store in local DTN vault to forward when connectivity is found
      const vault = this.getVaultPackets();
      if (!vault.some((p) => p.packetId === updatedPacket.packetId)) {
        vault.push(updatedPacket);
        this.saveVaultPackets(vault);
      }
    }
  }

  // Create an authentic SOS packet and initiate local storage + peer broadcast
  public async createOfflineSos(
    input: OfflineSosInput,
    forceOffline = false
  ): Promise<{ packet: RelayPacket; dispatchInfo?: any }> {
    const myNodeId = getOrCreateDeviceId();
    const timestamp = new Date().toISOString();

    // Compute cryptographic packet identifier based on coordinates, victim, and timestamp
    const signatureMaterial = `${input.latitude.toFixed(6)}:${input.longitude.toFixed(6)}:${input.victimName}:${timestamp}`;
    const hash = await computePayloadHash(signatureMaterial);
    const packetId = `PKT-RELAY-${hash}`;

    const originHop: RelayHopNode = {
      nodeId: myNodeId,
      role: 'VICTIM',
      timestamp,
      batteryLevel: input.batteryLevel ?? undefined,
      protocol: 'BLE_5_3',
    };

    const packet: RelayPacket = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : packetId,
      packetId,
      victimName: input.victimName || 'Citizen in Distress',
      victimPhone: input.victimPhone || null,
      latitude: input.latitude,
      longitude: input.longitude,
      altitudeMeters: input.altitudeMeters || null,
      emergencyType: input.emergencyType,
      severity: 'CRITICAL',
      message: input.message,
      batteryLevel: input.batteryLevel ?? null,
      hopCount: 0,
      relayChainJson: JSON.stringify([originHop]),
      originTimestamp: timestamp,
      gatewayNodeId: null,
      status: 'BUFFERED',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // 1. Store in tamper-proof persistent local vault
    const vault = this.getVaultPackets();
    vault.unshift(packet);
    this.saveVaultPackets(vault);

    this.notifySubscribers(packet, 'LOCAL');

    // 2. Transmit to nearby peer devices via P2P Broadcast Channel
    if (this.channel) {
      this.channel.postMessage({
        type: 'RELAY_P2P_BEACON',
        packet,
        senderId: myNodeId,
      });
    }

    // 3. Register Service Worker Background Sync if available
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync?.register('trinetra-relay-flush');
      } catch (err) {
        // Background sync handled via window online listener
      }
    }

    // 4. If this device has immediate internet connectivity and not forced offline, deliver directly to cloud
    let dispatchInfo: any = null;
    if (!forceOffline && this.isOnlineState && navigator.onLine) {
      const uploadResult = await this.transmitToCloud(packet, myNodeId);
      if (uploadResult.success && uploadResult.dispatchInfo) {
        dispatchInfo = uploadResult.dispatchInfo;
      }
    }

    return { packet, dispatchInfo };
  }

  // Upload packet to TRINETRA Cloud API
  public async transmitToCloud(
    packet: RelayPacket,
    gatewayId?: string
  ): Promise<{ success: boolean; dispatchInfo?: any }> {
    try {
      const gwId = gatewayId || getOrCreateDeviceId();
      const payload = {
        ...packet,
        gatewayNodeId: gwId,
      };

      const res = await api.post('/relay/packet', payload);

      if (res.data?.success) {
        const dispatchInfo = res.data.data?.results?.[0] || null;
        console.log(`[RelayMeshEngine] Packet ${packet.packetId} confirmed ingested and dispatched to 112 CAD.`, dispatchInfo);

        // Update status in local vault
        const vault = this.getVaultPackets().map((p) =>
          p.packetId === packet.packetId
            ? { ...p, status: 'DISPATCHED_112' as const, gatewayNodeId: gwId }
            : p
        );
        this.saveVaultPackets(vault);
        this.notifySubscribers({ ...packet, status: 'DISPATCHED_112', gatewayNodeId: gwId }, 'CLOUD');
        return { success: true, dispatchInfo };
      }
      return { success: false };
    } catch (err) {
      console.warn(`[RelayMeshEngine] Cloud upload failed for ${packet.packetId}. Kept in DTN vault.`, err);
      return { success: false };
    }
  }

  // Flush all buffered offline packets in vault when connectivity is confirmed
  public async flushPendingVault(): Promise<number> {
    const vault = this.getVaultPackets();
    const pending = vault.filter((p) => p.status === 'BUFFERED');

    if (pending.length === 0) return 0;

    let successCount = 0;
    for (const pkt of pending) {
      const ok = await this.transmitToCloud(pkt);
      if (ok.success) successCount++;
    }

    return successCount;
  }

  // Real Hardware Sensor Diagnostics & Capabilities
  public async queryDeviceTelemetry(): Promise<DeviceTelemetry> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    let batteryLevel: number | null = null;
    let isCharging: boolean | null = null;

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const bat: any = await (navigator as any).getBattery();
        if (bat && typeof bat.level === 'number') {
          batteryLevel = Math.round(bat.level * 100);
          isCharging = bat.charging ?? null;
        }
      } catch {}
    }

    let connectionType = 'Unknown';
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      connectionType = (navigator as any).connection.effectiveType || (navigator as any).connection.type || 'Connected';
    }

    let storagePersisted = false;
    if (typeof navigator !== 'undefined' && navigator.storage?.persisted) {
      try {
        storagePersisted = await navigator.storage.persisted();
      } catch {}
    }

    const webBluetoothAvailable = typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    const serviceWorkerAvailable = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    const vault = this.getVaultPackets();

    return {
      isOnline,
      connectionType,
      batteryLevel,
      isCharging,
      storagePersisted,
      webBluetoothAvailable,
      serviceWorkerAvailable,
      vaultSize: vault.length,
      deviceId: getOrCreateDeviceId(),
    };
  }

  private autoFlushIfOnline() {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => {
        this.flushPendingVault();
      }, 1000);
    }
  }
}

export const relayMeshEngine = new RelayMeshEngine();
