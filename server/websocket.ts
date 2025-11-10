import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.startHeartbeat();

    console.log('WebSocket server initialized on path /ws');
  }

  private handleConnection(ws: AuthenticatedWebSocket, request: any) {
    console.log('New WebSocket connection attempt');

    // Parse query parameters for authentication
    const { query } = parse(request.url, true);
    const userId = query.userId as string;
    const userRole = query.userRole as string;

    if (!userId) {
      console.log('WebSocket connection rejected: No userId provided');
      ws.close(1008, 'Authentication required');
      return;
    }

    ws.userId = userId;
    ws.userRole = userRole;
    ws.isAlive = true;

    // Add client to the map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);

    console.log(`WebSocket client connected: userId=${userId}, role=${userRole}`);
    console.log(`Total clients for user ${userId}: ${this.clients.get(userId)!.size}`);

    // Send connection confirmation
    this.sendToClient(ws, {
      type: 'connected',
      payload: { userId, userRole }
    });

    // Handle pong responses for heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log(`WebSocket client disconnected: userId=${userId}`);
      this.removeClient(userId, ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for userId=${userId}:`, error);
      this.removeClient(userId, ws);
    });
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    console.log(`Received message from ${ws.userId}:`, message.type);

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', payload: {} });
        break;
      case 'subscribe':
        // Handle subscription to specific channels if needed
        console.log(`User ${ws.userId} subscribed to:`, message.payload);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private removeClient(userId: string, ws: AuthenticatedWebSocket) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private startHeartbeat() {
    // Send ping every 30 seconds to keep connections alive
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((clientSet, userId) => {
        clientSet.forEach((ws) => {
          if (ws.isAlive === false) {
            console.log(`Terminating inactive connection for userId=${userId}`);
            this.removeClient(userId, ws);
            return ws.terminate();
          }

          ws.isAlive = false;
          ws.ping();
        });
      });
    }, 30000);
  }

  // Public methods to send notifications to users
  sendToUser(userId: string, message: WebSocketMessage) {
    const userClients = this.clients.get(userId);
    if (userClients && userClients.size > 0) {
      userClients.forEach((ws) => {
        this.sendToClient(ws, message);
      });
      console.log(`Sent message to user ${userId} (${userClients.size} clients)`);
      return true;
    }
    console.log(`No active connections for user ${userId}`);
    return false;
  }

  sendToRole(role: string, message: WebSocketMessage) {
    let count = 0;
    this.clients.forEach((clientSet) => {
      clientSet.forEach((ws) => {
        if (ws.userRole === role) {
          this.sendToClient(ws, message);
          count++;
        }
      });
    });
    console.log(`Sent message to ${count} clients with role ${role}`);
    return count > 0;
  }

  broadcast(message: WebSocketMessage) {
    let count = 0;
    this.clients.forEach((clientSet) => {
      clientSet.forEach((ws) => {
        this.sendToClient(ws, message);
        count++;
      });
    });
    console.log(`Broadcast message to ${count} clients`);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.clients.has(userId) && this.clients.get(userId)!.size > 0;
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.wss) {
      this.wss.close();
    }
    this.clients.clear();
  }
}

export const websocketService = new WebSocketService();
