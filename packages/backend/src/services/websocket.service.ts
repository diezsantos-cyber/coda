import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthUser, UserRole, WebSocketMessage } from '../types';
import { IncomingMessage } from 'http';

interface AuthenticatedWebSocket extends WebSocket {
  user?: AuthUser;
  isAlive?: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.heartbeatInterval = setInterval(() => {
      this.wss?.clients.forEach((ws) => {
        const authWs = ws as AuthenticatedWebSocket;
        if (authWs.isAlive === false) {
          this.removeClient(authWs);
          authWs.terminate();
          return;
        }
        authWs.isAlive = false;
        authWs.ping();
      });
    }, 30000);

    console.info('WebSocket server initialized');
  }

  private handleConnection(ws: AuthenticatedWebSocket, req: IncomingMessage): void {
    const url = new URL(req.url ?? '', `http://${req.headers.host ?? 'localhost'}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as {
        id: string;
        email: string;
        organizationId: string;
        role: UserRole;
      };

      ws.user = {
        id: decoded.id,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role,
      };

      ws.isAlive = true;
      this.addClient(ws);

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });

      ws.on('message', (data: { toString: () => string }) => {
        this.handleMessage(ws, String(data));
      });

      ws.send(
        JSON.stringify({
          type: 'connection_established',
          payload: { userId: decoded.id },
          timestamp: new Date().toISOString(),
        }),
      );
    } catch {
      ws.close(4001, 'Invalid token');
    }
  }

  private addClient(ws: AuthenticatedWebSocket): void {
    if (!ws.user) return;

    const orgId = ws.user.organizationId;
    if (!this.clients.has(orgId)) {
      this.clients.set(orgId, new Set());
    }
    this.clients.get(orgId)!.add(ws);
  }

  private removeClient(ws: AuthenticatedWebSocket): void {
    if (!ws.user) return;

    const orgClients = this.clients.get(ws.user.organizationId);
    if (orgClients) {
      orgClients.delete(ws);
      if (orgClients.size === 0) {
        this.clients.delete(ws.user.organizationId);
      }
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, _data: string): void {
    // For now, acknowledge receipt
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'message_received',
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  broadcastToOrganization(organizationId: string, message: WebSocketMessage): void {
    const orgClients = this.clients.get(organizationId);
    if (!orgClients) return;

    const payload = JSON.stringify(message);

    orgClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  sendToUser(organizationId: string, userId: string, message: WebSocketMessage): void {
    const orgClients = this.clients.get(organizationId);
    if (!orgClients) return;

    const payload = JSON.stringify(message);

    orgClients.forEach((client) => {
      if (client.user?.id === userId && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  getConnectionCount(organizationId?: string): number {
    if (organizationId) {
      return this.clients.get(organizationId)?.size ?? 0;
    }

    let total = 0;
    this.clients.forEach((clients) => {
      total += clients.size;
    });
    return total;
  }

  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.wss?.clients.forEach((client) => {
      client.close(1001, 'Server shutting down');
    });

    this.wss?.close();
    this.clients.clear();
    console.info('WebSocket server shut down');
  }
}

export const wsService = new WebSocketService();
