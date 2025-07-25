import { WebSocket } from 'uws';
import { EventEmitter } from 'events';
import { ISocket, EventHandler, Message } from '../types';
import { generateId, serializeMessage, deserializeMessage, isValidEventName } from '../utils';
import type { NanoSocket } from './NanoSocket';

interface SocketUserData {
  socketId?: string;
}

/**
 * Represents a single WebSocket connection with socket.io-like API
 * @class NanoSocketConnection
 * @implements {ISocket}
 * @extends EventEmitter
 */
export class NanoSocketConnection extends EventEmitter implements ISocket {
  public readonly id: string;
  public readonly ws: WebSocket<SocketUserData>;
  private server: NanoSocket;
  private rooms: Set<string> = new Set();
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  /**
   * Creates a new socket connection
   * @param {string} id - Unique socket identifier
   * @param {WebSocket} ws - uWebSockets WebSocket instance
   * @param {NanoSocket} server - Server instance
   */
  constructor(id: string, ws: WebSocket<SocketUserData>, server: NanoSocket) {
    super();
    this.id = id;
    this.ws = ws;
    this.server = server;
  }

  /**
   * Emits an event to this socket
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event: string, ...args: any[]): boolean {
    if (!isValidEventName(event)) {
      throw new Error(`Invalid event name: ${event}`);
    }

    const message: Message = {
      event,
      data: args,
      id: generateId(),
      timestamp: Date.now()
    };

    this.send(serializeMessage(message));
    return true;
  }

  /**
   * Registers an event handler
   * @param {string} event - Event name
   * @param {EventHandler} handler - Event handler function
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
   * Joins a room
   * @param {string} room - Room name
   */
  join(room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.add(room);
      this.server.joinRoom(this.id, room);
      super.emit('join', room);
    }
  }

  /**
   * Leaves a room
   * @param {string} room - Room name
   */
  leave(room: string): void {
    if (this.rooms.has(room)) {
      this.rooms.delete(room);
      this.server.leaveRoom(this.id, room);
      super.emit('leave', room);
    }
  }

  /**
   * Broadcasts to all sockets in a room
   * @param {string} room - Room name
   * @returns {object} Object with emit method
   */
  to(room: string): {
    emit: (event: string, ...args: any[]) => void;
  } {
    return {
      emit: (event: string, ...args: any[]) => {
        this.server.broadcastToRoom(room, event, ...args);
      }
    };
  }

  /**
   * Broadcasts to all connected sockets
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  broadcast(event: string, ...args: any[]): void {
    this.server.broadcast(event, ...args);
  }

  /**
   * Sends raw data to the socket
   * @param {string} data - Data to send
   */
  send(data: string | Buffer): void {
    if (!this.ws) {
      return;
    }
    
    try {
      if (this.ws.getBufferedAmount() < 64 * 1024) {
        this.ws.send(data);
      } else {
        super.emit('error', new Error('Backpressure limit exceeded'));
      }
    } catch (error) {
      super.emit('error', error);
    }
  }

  /**
   * Handles incoming messages
   * @param {Message} message - Parsed message object
   */
  handleMessage(message: Message): void {
    try {
      super.emit(message.event, ...message.data);
      
      const handlers = this.eventHandlers.get(message.event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(...message.data);
          } catch (error) {
            super.emit('error', error);
          }
        });
      }
    } catch (error) {
      super.emit('error', error);
    }
  }

  /**
   * Disconnects the socket
   */
  disconnect(): void {
    try {
      for (const room of this.rooms) {
        this.server.leaveRoom(this.id, room);
      }
      this.rooms.clear();
      
      if (this.ws) {
        this.ws.close();
      }
      
      super.emit('disconnect');
      super.removeAllListeners();
    } catch (error) {
      super.emit('error', error);
    }
  }

  /**
   * Gets the remote address of the socket
   * @returns {string} Remote address
   */
  get remoteAddress(): string {
    try {
      const buffer = this.ws.getRemoteAddressAsText();
      return Buffer.from(buffer).toString();
    } catch {
      return 'unknown';
    }
  }

  /**
   * Gets all rooms this socket has joined
   * @returns {string[]} Array of room names
   */
  get joinedRooms(): string[] {
    return Array.from(this.rooms);
  }

  /**
   * Checks if the socket is connected
   * @returns {boolean} True if connected
   */
  get connected(): boolean {
    try {
      return this.ws !== null && this.ws !== undefined;
    } catch {
      return false;
    }
  }
}