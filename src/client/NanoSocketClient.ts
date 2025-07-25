import { EventEmitter } from 'events';
import WebSocket, { MessageEvent, CloseEvent, ErrorEvent } from 'ws';
import { ClientOptions, ConnectionState, Message, EventHandler } from '../types';
import { generateId, serializeMessage, deserializeMessage, isValidEventName } from '../utils';

/**
 * Ultra-fast WebSocket client with socket.io-like API
 * @class NanoSocketClient
 * @extends EventEmitter
 */
export class NanoSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private options: Required<ClientOptions>;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private eventHandlers: Map<string, EventHandler[]> = new Map();
  private messageQueue: string[] = [];

  /**
   * Creates a new NanoSocketClient instance
   * @param {string} url - WebSocket server URL
   * @param {ClientOptions} options - Client configuration options
   */
  constructor(url: string, options: ClientOptions = {}) {
    super();
    
    this.url = url;
    this.options = {
      autoConnect: options.autoConnect !== false,
      reconnection: options.reconnection !== false,
      reconnectionAttempts: options.reconnectionAttempts || 5,
      reconnectionDelay: options.reconnectionDelay || 1000,
      timeout: options.timeout || 20000
    };

    if (this.options.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connects to the WebSocket server
   * @returns {Promise<void>} Promise that resolves when connected
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === ConnectionState.CONNECTED || this.state === ConnectionState.CONNECTING) {
        resolve();
        return;
      }

      this.state = ConnectionState.CONNECTING;
      this.emit('connecting');

      try {
        this.ws = new WebSocket(this.url);
        
        const timeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            const error = new Error('Connection timeout');
            this.emit('error', error);
            reject(error);
          }
        }, this.options.timeout);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.emit('connect');
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          const data = typeof event.data === 'string' ? event.data : event.data.toString();
          this.handleMessage(data);
        };

        this.ws.onclose = (event: CloseEvent) => {
          clearTimeout(timeout);
          this.handleDisconnection(event.code, event.reason);
        };

        this.ws.onerror = (error: ErrorEvent) => {
          clearTimeout(timeout);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        this.state = ConnectionState.DISCONNECTED;
        this.emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server
   */
  disconnect(): void {
    this.options.reconnection = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
    }

    this.state = ConnectionState.DISCONNECTED;
    this.emit('disconnect', 'client disconnect');
  }

  /**
   * Emits an event to the server
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event: string, ...args: any[]): boolean {
    if (event === 'connect' || event === 'disconnect' || event === 'error' || event === 'connecting' || event === 'reconnecting') {
      return super.emit(event, ...args);
    }

    if (!isValidEventName(event)) {
      throw new Error(`Invalid event name: ${event}`);
    }

    const message: Message = {
      event,
      data: args,
      id: generateId(),
      timestamp: Date.now()
    };

    const serialized = serializeMessage(message);

    if (this.state === ConnectionState.CONNECTED && this.ws) {
      this.ws.send(serialized);
    } else {
      this.messageQueue.push(serialized);
    }

    return true;
  }

  /**
   * Registers an event handler
   * @param {string} event - Event name
   * @param {EventHandler} handler - Event handler function
   * @returns {this} Client instance for chaining
   */
  on(event: string, handler: EventHandler): this {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    super.on(event, handler);
    return this;
  }

  /**
   * Removes an event handler
   * @param {string} event - Event name
   * @param {EventHandler} handler - Event handler function (optional)
   * @returns {this} Client instance for chaining
   */
  off(event: string, handler?: EventHandler): this {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        if (handlers.length === 0) {
          this.eventHandlers.delete(event);
        }
      }
      super.off(event, handler);
    } else {
      this.eventHandlers.delete(event);
      super.removeAllListeners(event);
    }
    return this;
  }

  /**
   * Registers a one-time event handler
   * @param {string} event - Event name
   * @param {EventHandler} handler - Event handler function
   * @returns {this} Client instance for chaining
   */
  once(event: string, handler: EventHandler): this {
    super.once(event, handler);
    return this;
  }

  /**
   * Handles incoming messages from the server
   * @private
   * @param {string} data - Raw message data
   */
  private handleMessage(data: string): void {
    try {
      const message = deserializeMessage(data);
      
      super.emit(message.event, ...message.data);
      
      const handlers = this.eventHandlers.get(message.event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(...message.data);
          } catch (error) {
            this.emit('error', error);
          }
        });
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  /**
   * Handles disconnection from the server
   * @private
   * @param {number} code - Close code
   * @param {string} reason - Close reason
   */
  private handleDisconnection(code: number, reason: string): void {
    this.state = ConnectionState.DISCONNECTED;
    
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws = null;
    }
    
    this.emit('disconnect', reason || 'Connection closed');

    if (this.options.reconnection && this.reconnectAttempts < this.options.reconnectionAttempts && code !== 1000) {
      this.attemptReconnection();
    } else if (this.reconnectAttempts >= this.options.reconnectionAttempts) {
      this.emit('reconnect_failed');
    }
  }

  /**
   * Attempts to reconnect to the server
   * @private
   */
  private attemptReconnection(): void {
    this.state = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;
    
    this.emit('reconnecting', this.reconnectAttempts);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {
        if (this.reconnectAttempts >= this.options.reconnectionAttempts) {
          this.emit('reconnect_failed');
        }
      });
    }, this.options.reconnectionDelay * this.reconnectAttempts);
  }

  /**
   * Flushes queued messages when connection is established
   * @private
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws && this.state === ConnectionState.CONNECTED) {
      const message = this.messageQueue.shift();
      if (message) {
        this.ws.send(message);
      }
    }
  }

  /**
   * Gets the current connection state
   * @returns {ConnectionState} Current connection state
   */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /**
   * Checks if the client is connected
   * @returns {boolean} True if connected
   */
  get connected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Gets the WebSocket ready state
   * @returns {number} WebSocket ready state
   */
  get readyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }

  /**
   * Gets the server URL
   * @returns {string} Server URL
   */
  get serverUrl(): string {
    return this.url;
  }

  /**
   * Gets the number of reconnection attempts made
   * @returns {number} Number of reconnection attempts
   */
  get reconnectionAttempts(): number {
    return this.reconnectAttempts;
  }
}