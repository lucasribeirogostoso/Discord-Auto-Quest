import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type:
    | 'quest-update'
    | 'status-update'
    | 'log'
    | 'user-update'
    | 'execute-quest'
    | 'get-quests'
    | 'get-status';
  data?: any;
  questId?: string;
}

export class DiscordWebSocketServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private discordConnection: WebSocket | null = null;
  private rendererConnections: Set<WebSocket> = new Set();
  private port: number;
  private isRunning: boolean = false;

  constructor(port: number = 8765) {
    super();
    this.port = port;
  }

  start(): void {
    if (this.isRunning && this.wss) {
      console.log(`[WebSocket] Server already running on port ${this.port}`);
      return;
    }

    // Tentar parar qualquer servidor existente primeiro
    if (this.wss) {
      try {
        this.wss.close();
      } catch (e) {
        // Ignorar erros ao fechar
      }
      this.wss = null;
      this.isRunning = false;
    }

    try {
      this.wss = new WebSocketServer({ port: this.port });

      // Registrar handler de erro IMEDIATAMENTE após criar o servidor
      this.wss.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.error(
            `[WebSocket] Port ${this.port} is already in use. Trying alternative port...`
          );
          this.wss = null;
          this.isRunning = false;
          // Tentar porta alternativa
          this.tryAlternativePort();
        } else {
          console.error('[WebSocket] Server error:', error);
        }
      });

      this.wss.on('connection', (ws: WebSocket, req) => {
        const origin = req.headers.origin || '';

        // Check if connection is from Discord (via CDP) or Renderer
        if (origin.includes('discord.com') || origin === '') {
          // Discord connection
          console.log('[WebSocket] Discord connected');
          this.discordConnection = ws;
          this.setupDiscordConnection(ws);
        } else {
          // Renderer connection
          console.log('[WebSocket] Renderer connected');
          this.rendererConnections.add(ws);
          this.setupRendererConnection(ws);
        }
      });

      this.isRunning = true;
      console.log(`[WebSocket] Server started on port ${this.port}`);
    } catch (error: any) {
      // Este catch pode não capturar EADDRINUSE se for emitido como evento assíncrono
      // Mas é bom ter para outros tipos de erros síncronos
      console.error('[WebSocket] Failed to start server:', error);
      this.wss = null;
      this.isRunning = false;

      if (error.code === 'EADDRINUSE') {
        this.tryAlternativePort();
      } else {
        // Para outros erros, tentar porta alternativa de qualquer forma
        setTimeout(() => this.tryAlternativePort(), 100);
      }
    }
  }

  private tryAlternativePort(): void {
    // Tentar portas de 8766 a 8775
    for (let port = 8766; port <= 8775; port++) {
      try {
        console.log(`[WebSocket] Trying port ${port}...`);
        this.port = port;
        this.wss = new WebSocketServer({ port: this.port });

        // Registrar handler de erro IMEDIATAMENTE
        this.wss.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            // Se essa porta também estiver em uso, tentar próxima
            console.error(`[WebSocket] Port ${port} is also in use. Trying next port...`);
            this.wss = null;
            this.isRunning = false;
            // Chamar tryAlternativePort novamente, que tentará a próxima porta
            this.tryAlternativePort();
          } else {
            console.error(`[WebSocket] Error on port ${port}:`, error);
          }
        });

        this.wss.on('connection', (ws: WebSocket, req) => {
          const origin = req.headers.origin || '';

          if (origin.includes('discord.com') || origin === '') {
            console.log('[WebSocket] Discord connected');
            this.discordConnection = ws;
            this.setupDiscordConnection(ws);
          } else {
            console.log('[WebSocket] Renderer connected');
            this.rendererConnections.add(ws);
            this.setupRendererConnection(ws);
          }
        });

        this.isRunning = true;
        console.log(`[WebSocket] Server started on alternative port ${this.port}`);
        return;
      } catch (error: any) {
        if (error.code === 'EADDRINUSE' && port < 8775) {
          // Continuar para próxima porta
          continue;
        } else if (error.code === 'EADDRINUSE') {
          console.error(
            '[WebSocket] All ports in range (8765-8775) are in use. Please close other instances.'
          );
          return;
        } else {
          console.error(`[WebSocket] Failed to start on port ${port}:`, error);
          throw error;
        }
      }
    }
  }

  private setupDiscordConnection(ws: WebSocket): void {
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log('[WebSocket] Message from Discord:', message.type);

        // Forward to all renderer connections
        this.broadcastToRenderers(message);

        // Emit event for main process listeners
        this.emit('discord-message', message);
      } catch (error) {
        console.error('[WebSocket] Error parsing Discord message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Discord disconnected');
      this.discordConnection = null;
      this.emit('discord-disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Discord connection error:', error);
    });
  }

  private setupRendererConnection(ws: WebSocket): void {
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log('[WebSocket] Message from Renderer:', message.type);

        // Forward to Discord if connected
        if (this.discordConnection && this.discordConnection.readyState === WebSocket.OPEN) {
          this.discordConnection.send(JSON.stringify(message));
        }

        // Emit event for main process listeners
        this.emit('renderer-message', message);
      } catch (error) {
        console.error('[WebSocket] Error parsing Renderer message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Renderer disconnected');
      this.rendererConnections.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Renderer connection error:', error);
      this.rendererConnections.delete(ws);
    });
  }

  private broadcastToRenderers(message: WebSocketMessage): void {
    const messageStr = JSON.stringify(message);
    this.rendererConnections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('[WebSocket] Error sending to renderer:', error);
          this.rendererConnections.delete(ws);
        }
      }
    });
  }

  sendToDiscord(message: WebSocketMessage): boolean {
    if (this.discordConnection && this.discordConnection.readyState === WebSocket.OPEN) {
      try {
        this.discordConnection.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('[WebSocket] Error sending to Discord:', error);
        return false;
      }
    }
    return false;
  }

  sendToRenderer(message: WebSocketMessage): void {
    this.broadcastToRenderers(message);
  }

  isDiscordConnected(): boolean {
    return this.discordConnection !== null && this.discordConnection.readyState === WebSocket.OPEN;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.rendererConnections.forEach((ws) => {
      ws.close();
    });
    this.rendererConnections.clear();

    if (this.discordConnection) {
      this.discordConnection.close();
      this.discordConnection = null;
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.isRunning = false;
    console.log('[WebSocket] Server stopped');
  }
}
