// server/src/services/AlertBroadcaster.ts
import { Response } from 'express';

interface SseClient {
  id: string;
  res: Response;
  registeredAt: Date;
}

class AlertBroadcasterService {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  // Register a new client for SSE
  registerClient(id: string, res: Response) {
    this.clients.set(id, {
      id,
      res,
      registeredAt: new Date(),
    });

    console.log(`[SSE] Client connected: ${id}. Active subscribers: ${this.clients.size}`);

    // Send initial handshake ping
    this.sendToClient(id, 'CONNECTED', {
      clientId: id,
      timestamp: new Date().toISOString(),
      message: 'Subscribed to TRINETRA live emergency alert stream',
    });
  }

  // Remove client on disconnect
  unregisterClient(id: string) {
    this.clients.delete(id);
    console.log(`[SSE] Client disconnected: ${id}. Active subscribers: ${this.clients.size}`);
  }

  // Broadcast event to all active clients
  broadcast(eventType: 'ALERT_PUBLISHED' | 'ALERT_WITHDRAWN' | 'INCIDENT_REPORTED', data: any) {
    const payload = JSON.stringify({
      eventType,
      data,
      timestamp: new Date().toISOString(),
    });

    console.log(`[SSE BROADCAST] ${eventType} dispatched to ${this.clients.size} clients`);

    for (const [clientId, client] of this.clients.entries()) {
      try {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        console.error(`[SSE] Failed writing to client ${clientId}:`, err);
        this.unregisterClient(clientId);
      }
    }
  }

  // Send event to specific client
  private sendToClient(clientId: string, eventType: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.res.write(`event: ${eventType}\n`);
        client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch {
        this.unregisterClient(clientId);
      }
    }
  }

  // Periodic heartbeat to prevent proxy timeout
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const pingPayload = JSON.stringify({ ping: true, timestamp: new Date().toISOString() });
      for (const [clientId, client] of this.clients.entries()) {
        try {
          client.res.write(`event: STATUS_PING\n`);
          client.res.write(`data: ${pingPayload}\n\n`);
        } catch {
          this.unregisterClient(clientId);
        }
      }
    }, 15000); // 15 seconds
  }
}

export const alertBroadcaster = new AlertBroadcasterService();
