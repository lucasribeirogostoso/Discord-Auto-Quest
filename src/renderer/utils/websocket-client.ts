export interface WebSocketMessage {
  type: 'quest-update' | 'status-update' | 'log' | 'user-update' | 'execute-quest' | 'get-quests' | 'get-status';
  data?: any;
  questId?: string;
}

// Simple EventEmitter implementation for browser
class EventEmitter {
  private events: { [key: string]: Array<(...args: any[]) => void> } = {};

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
    return this;
  }
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(private port: number = 8765) {
    super();
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const url = `ws://localhost:${this.port}`;

    try {
      // Adicionar timeout para conexão WebSocket (não travar indefinidamente)
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('[WebSocket Client] Connection timeout, closing...');
          this.ws.close();
          this.isConnecting = false;
          this.emit('disconnected');
        }
      }, 5000); // 5 segundos timeout

      this.ws = new WebSocket(url);
      
      // Limpar timeout quando conectar
      this.ws.addEventListener('open', () => {
        clearTimeout(connectionTimeout);
      });
      
      this.ws.addEventListener('error', () => {
        clearTimeout(connectionTimeout);
      });

      this.ws.onopen = () => {
        console.log('[WebSocket Client] Connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Limpar timeout já foi feito no addEventListener
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.emit('message', message);
          
          // Emit specific event types
          switch (message.type) {
            case 'quest-update':
              this.emit('quest-update', message.data);
              break;
            case 'status-update':
              this.emit('status-update', message.data);
              break;
            case 'log':
              this.emit('log', message.data);
              break;
            case 'user-update':
              this.emit('user-update', message.data);
              break;
          }
        } catch (error) {
          console.error('[WebSocket Client] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket Client] Error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('[WebSocket Client] Disconnected');
        this.isConnecting = false;
        this.emit('disconnected');

        // Attempt to reconnect
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`[WebSocket Client] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
          
          setTimeout(() => {
            this.connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[WebSocket Client] Connection error:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('[WebSocket Client] Send error:', error);
        return false;
      }
    }
    return false;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

