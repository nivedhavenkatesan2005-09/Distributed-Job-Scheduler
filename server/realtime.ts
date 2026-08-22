/**
 * Realtime Communication Hub
 * Manages dual-mode real-time transport: WebSocket (/ws) and Server-Sent Events (/api/events)
 * with topic subscriptions, heartbeat keep-alive, and sub-millisecond broadcast latency.
 */

import { Response } from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';

interface WSClientContext {
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>;
  connectedAt: string;
}

class RealtimeHub {
  private sseClients: Set<Response> = new Set();
  private wsClients: Map<WebSocket, WSClientContext> = new Map();
  private wss: WebSocketServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initWebSocket(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientCtx: WSClientContext = {
        ws,
        isAlive: true,
        subscriptions: new Set(['*']), // default all
        connectedAt: new Date().toISOString()
      };

      this.wsClients.set(ws, clientCtx);

      // Send greeting
      ws.send(JSON.stringify({
        type: 'ws:connected',
        protocol: 'websocket',
        timestamp: new Date().toISOString(),
        serverTime: Date.now(),
        message: 'Connected to Hyperplane Real-Time Distributed Event Stream (WebSocket)'
      }));

      ws.on('pong', () => {
        clientCtx.isAlive = true;
      });

      ws.on('message', (messageRaw) => {
        try {
          const msg = JSON.parse(messageRaw.toString());
          if (msg.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', clientTimestamp: msg.timestamp, serverTimestamp: Date.now() }));
          } else if (msg.type === 'subscribe' && msg.channel) {
            clientCtx.subscriptions.add(msg.channel);
            ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
          } else if (msg.type === 'unsubscribe' && msg.channel) {
            clientCtx.subscriptions.delete(msg.channel);
            ws.send(JSON.stringify({ type: 'unsubscribed', channel: msg.channel }));
          }
        } catch (err) {
          // ignore malformed msg
        }
      });

      ws.on('close', () => {
        this.wsClients.delete(ws);
      });

      ws.on('error', () => {
        this.wsClients.delete(ws);
      });
    });

    // Heartbeat ping loop every 15s
    this.heartbeatInterval = setInterval(() => {
      for (const [ws, ctx] of this.wsClients.entries()) {
        if (!ctx.isAlive) {
          ws.terminate();
          this.wsClients.delete(ws);
          continue;
        }
        ctx.isAlive = false;
        ws.ping();
      }
    }, 15000);

    console.log('[Realtime] WebSocket Server mounted at /ws');
  }

  addSSEClient(res: Response) {
    this.sseClients.add(res);
  }

  removeSSEClient(res: Response) {
    this.sseClients.delete(res);
  }

  /**
   * Broadcast payload to ALL connected WebSocket and SSE clients simultaneously.
   */
  broadcast(data: any, channel: string = '*') {
    const jsonStr = JSON.stringify(data);

    // 1. Broadcast to WebSockets
    for (const [ws, ctx] of this.wsClients.entries()) {
      if (ws.readyState === WebSocket.OPEN) {
        if (ctx.subscriptions.has('*') || ctx.subscriptions.has(channel)) {
          try {
            ws.send(jsonStr);
          } catch {
            this.wsClients.delete(ws);
          }
        }
      }
    }

    // 2. Broadcast to SSE
    const ssePayload = `data: ${jsonStr}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(ssePayload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  getStats() {
    return {
      activeWebSockets: this.wsClients.size,
      activeSSEClients: this.sseClients.size,
      totalRealtimeClients: this.wsClients.size + this.sseClients.size
    };
  }
}

export const realtimeHub = new RealtimeHub();
