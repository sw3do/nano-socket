import { App, WebSocket, us_listen_socket, us_listen_socket_close, TemplatedApp } from 'uws';
import { EventEmitter } from 'events';
import { ServerOptions, ISocket, EventHandler, Message, Room, Middleware } from '../types';
import { generateId, serializeMessage, deserializeMessage, isValidEventName } from '../utils';
import { NanoSocketConnection } from './NanoSocketConnection';

interface SocketUserData {
  socketId?: string;
}

/**
 * Ultra-fast WebSocket server built on uWebSockets.js with socket.io-like API
 * @class NanoSocket
 * @extends EventEmitter
 */
export class NanoSocket extends EventEmitter {
  private app: TemplatedApp;
  private listenSocket: us_listen_socket | null = null;
  private connections: Map<string, NanoSocketConnection> = new Map();
  private rooms: Map<string, Room> = new Map();
  private middlewares: Middleware[] = [];
  private options: Required<ServerOptions>;

  /**
   * Creates a new NanoSocket server instance
   * @param {ServerOptions} options - Server configuration options
   */
  constructor(options: ServerOptions = {}) {
    super();
    
    this.options = {
      port: options.port || 3000,
      host: options.host || '0.0.0.0',
      compression: options.compression !== false,
      maxCompressedSize: options.maxCompressedSize || 64 * 1024,
      maxBackpressure: options.maxBackpressure || 64 * 1024,
      cors: {
        origin: options.cors?.origin || '*',
        credentials: options.cors?.credentials || false
      }
    };

    this.app = App({});

    this.setupRoutes();
  }

  /**
   * Sets up WebSocket routes and handlers
   * @private
   */
  private setupRoutes(): void {
    this.app.ws('/*', {
      compression: this.options.compression ? 1 : 0,
      maxBackpressure: this.options.maxBackpressure,
      
      open: (ws: WebSocket<SocketUserData>) => {
        this.handleConnection(ws);
      },
      
      message: (ws: WebSocket<SocketUserData>, message: ArrayBuffer, isBinary: boolean) => {
        this.handleMessage(ws, message, isBinary ? 1 : 0);
      },
      
      close: (ws: WebSocket<SocketUserData>, code: number, message: ArrayBuffer) => {
        this.handleDisconnection(ws, code, message);
      }
    });

    if (this.options.cors) {
      this.app.options('/*', (res: any, req: any) => {
        this.setCorsHeaders(res);
        res.end();
      });
    }
  }

  /**
   * Sets CORS headers on response
   * @private
   * @param {any} res - Response object
   */
  private setCorsHeaders(res: any): void {
    const { origin, credentials } = this.options.cors;
    
    if (typeof origin === 'string') {
      res.writeHeader('Access-Control-Allow-Origin', origin);
    } else if (Array.isArray(origin)) {
      res.writeHeader('Access-Control-Allow-Origin', origin.join(', '));
    } else if (origin === true) {
      res.writeHeader('Access-Control-Allow-Origin', '*');
    }
    
    if (credentials) {
      res.writeHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.writeHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.writeHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  /**
   * Handles new WebSocket connections
   * @private
   * @param {WebSocket} ws - WebSocket instance
   */
  private async handleConnection(ws: WebSocket<SocketUserData>): Promise<void> {
    const socketId = generateId();
    ws.getUserData().socketId = socketId;
    const connection = new NanoSocketConnection(socketId, ws, this);
    
    this.connections.set(socketId, connection);
    
    try {
      await this.runMiddlewares(connection);
      this.emit('connection', connection);
    } catch (error) {
      connection.disconnect();
      this.emit('error', error);
    }
  }

  /**
   * Runs middleware chain for new connections
   * @private
   * @param {NanoSocketConnection} socket - Socket connection
   */
  private async runMiddlewares(socket: NanoSocketConnection): Promise<void> {
    for (const middleware of this.middlewares) {
      await new Promise<void>((resolve, reject) => {
        middleware(socket, (err?: Error) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /**
   * Handles incoming WebSocket messages
   * @private
   * @param {WebSocket} ws - WebSocket instance
   * @param {ArrayBuffer} message - Message buffer
   * @param {number} opCode - Operation code
   */
  private handleMessage(ws: WebSocket<SocketUserData>, message: ArrayBuffer, opCode: number): void {
    try {
      if (message.byteLength === 0) {
        return;
      }
      
      const data = Buffer.from(message).toString('utf8');
      const parsedMessage = deserializeMessage(data);
      const connection = this.getConnectionByWs(ws);
      
      if (connection) {
        connection.handleMessage(parsedMessage);
      }
    } catch (error) {
      const connection = this.getConnectionByWs(ws);
      if (connection) {
        connection.emit('error', error);
      }
      this.emit('error', error);
    }
  }

  /**
   * Handles WebSocket disconnections
   * @private
   * @param {WebSocket} ws - WebSocket instance
   * @param {number} code - Close code
   * @param {ArrayBuffer} message - Close message
   */
  private handleDisconnection(ws: WebSocket<SocketUserData>, code: number, message: ArrayBuffer): void {
    const connection = this.getConnectionByWs(ws);
    if (connection) {
      this.removeConnection(connection.id);
      this.emit('disconnect', connection, code);
    }
  }

  /**
   * Gets connection by WebSocket instance
   * @private
   * @param {WebSocket} ws - WebSocket instance
   * @returns {NanoSocketConnection | undefined} Connection instance
   */
  private getConnectionByWs(ws: WebSocket<SocketUserData>): NanoSocketConnection | undefined {
    const socketId = ws.getUserData()?.socketId;
    if (socketId) {
      return this.connections.get(socketId);
    }
    
    for (const connection of this.connections.values()) {
      if (connection.ws === ws) {
        return connection;
      }
    }
    return undefined;
  }

  /**
   * Adds middleware to the server
   * @param {Middleware} middleware - Middleware function
   * @returns {NanoSocket} Server instance for chaining
   */
  use(middleware: Middleware): NanoSocket {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Registers an event handler
   * @param {string} event - Event name
   * @param {EventHandler} handler - Event handler function
   * @returns {this} Server instance for chaining
   */
  on(event: string, handler: EventHandler): this {
    super.on(event, handler);
    return this;
  }

  /**
   * Emits an event to all connected sockets
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   * @returns {boolean} True if event had listeners
   */
  emit(event: string, ...args: any[]): boolean {
    if (event === 'broadcast') {
      this.broadcast(args[0], ...args.slice(1));
      return true;
    }
    return super.emit(event, ...args);
  }

  /**
   * Broadcasts a message to all connected sockets
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  broadcast(event: string, ...args: any[]): void {
    if (!isValidEventName(event)) {
      throw new Error(`Invalid event name: ${event}`);
    }

    const message: Message = {
      event,
      data: args,
      timestamp: Date.now()
    };

    const serialized = serializeMessage(message);
    const buffer = Buffer.from(serialized);
    
    for (const connection of this.connections.values()) {
      try {
        if (connection.ws && connection.ws.getBufferedAmount() < this.options.maxBackpressure) {
          connection.ws.send(buffer);
        }
      } catch (error) {
        connection.emit('error', error);
      }
    }
  }

  /**
   * Broadcasts a message to all sockets in a specific room
   * @param {string} room - Room name
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  to(room: string): {
    emit: (event: string, ...args: any[]) => void;
  } {
    return {
      emit: (event: string, ...args: any[]) => {
        this.broadcastToRoom(room, event, ...args);
      }
    };
  }

  /**
   * Broadcasts a message to all sockets in a room
   * @param {string} roomName - Room name
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  broadcastToRoom(roomName: string, event: string, ...args: any[]): void {
    const room = this.rooms.get(roomName);
    if (!room || room.sockets.size === 0) return;

    const message: Message = {
      event,
      data: args,
      timestamp: Date.now()
    };

    const serialized = serializeMessage(message);
    const buffer = Buffer.from(serialized);
    
    for (const socketId of room.sockets) {
      const connection = this.connections.get(socketId);
      if (connection && connection.ws) {
        try {
          if (connection.ws.getBufferedAmount() < this.options.maxBackpressure) {
            connection.ws.send(buffer);
          }
        } catch (error) {
          connection.emit('error', error);
        }
      }
    }
  }

  /**
   * Adds a socket to a room
   * @param {string} socketId - Socket ID
   * @param {string} roomName - Room name
   */
  joinRoom(socketId: string, roomName: string): void {
    let room = this.rooms.get(roomName);
    if (!room) {
      room = { name: roomName, sockets: new Set() };
      this.rooms.set(roomName, room);
    }
    room.sockets.add(socketId);
  }

  /**
   * Removes a socket from a room
   * @param {string} socketId - Socket ID
   * @param {string} roomName - Room name
   */
  leaveRoom(socketId: string, roomName: string): void {
    const room = this.rooms.get(roomName);
    if (room) {
      room.sockets.delete(socketId);
      if (room.sockets.size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  /**
   * Removes a connection from the server
   * @param {string} socketId - Socket ID
   */
  removeConnection(socketId: string): void {
    this.connections.delete(socketId);
    
    for (const room of this.rooms.values()) {
      room.sockets.delete(socketId);
    }
    
    this.rooms.forEach((room, roomName) => {
      if (room.sockets.size === 0) {
        this.rooms.delete(roomName);
      }
    });
  }

  /**
   * Gets the number of connected sockets
   * @returns {number} Number of connections
   */
  get connectionCount(): number {
    return this.connections.size;
  }

  /**
   * Gets all room names
   * @returns {string[]} Array of room names
   */
  get roomNames(): string[] {
    return Array.from(this.rooms.keys());
  }

  /**
   * Starts the server
   * @param {number} port - Port number (optional, uses constructor option if not provided)
   * @param {string} host - Host address (optional, uses constructor option if not provided)
   * @returns {Promise<void>} Promise that resolves when server starts
   */
  listen(port?: number, host?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const listenPort = port || this.options.port;
      const listenHost = host || this.options.host;
      
      this.app.listen(listenHost, listenPort, (token) => {
        if (token) {
          this.listenSocket = token;
          this.emit('listening', listenPort, listenHost);
          resolve();
        } else {
          const error = new Error(`Failed to listen on ${listenHost}:${listenPort}`);
          this.emit('error', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Stops the server
   * @returns {Promise<void>} Promise that resolves when server stops
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.listenSocket) {
        us_listen_socket_close(this.listenSocket);
        this.listenSocket = null;
      }
      
      for (const connection of this.connections.values()) {
        connection.disconnect();
      }
      
      this.connections.clear();
      this.rooms.clear();
      
      this.emit('close');
      resolve();
    });
  }
}