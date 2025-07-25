/**
 * Event handler function type
 */
export type EventHandler = (...args: any[]) => void;

/**
 * Socket connection interface
 */
export interface ISocket {
  id: string;
  remoteAddress: string;
  emit(event: string, ...args: any[]): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler?: EventHandler): void;
  disconnect(): void;
  join(room: string): void;
  leave(room: string): void;
}

/**
 * Server options interface
 */
export interface ServerOptions {
  port?: number;
  host?: string;
  compression?: boolean;
  maxCompressedSize?: number;
  maxBackpressure?: number;
  cors?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
  };
}

/**
 * Client options interface
 */
export interface ClientOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

/**
 * Connection state enum
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}

/**
 * Message interface
 */
export interface Message {
  event: string;
  data: any;
  id?: string;
  timestamp?: number;
}

/**
 * Room interface
 */
export interface Room {
  name: string;
  sockets: Set<string>;
}

/**
 * Middleware function type
 */
export type Middleware = (socket: ISocket, next: (err?: Error) => void) => void;