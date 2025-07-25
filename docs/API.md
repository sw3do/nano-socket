# NanoSocket API Documentation

This document provides detailed API documentation for NanoSocket.

## Table of Contents

- [Server API](#server-api)
- [Client API](#client-api)
- [Types](#types)
- [Examples](#examples)

## Server API

### NanoSocket Class

The main server class for creating WebSocket servers.

#### Constructor

```typescript
new NanoSocket(options?: ServerOptions)
```

**Parameters:**
- `options` (optional): Server configuration options

**ServerOptions Interface:**
```typescript
interface ServerOptions {
  port?: number;           // Server port (default: 3000)
  host?: string;           // Server host (default: '0.0.0.0')
  compression?: boolean;   // Enable compression (default: true)
  maxCompressedSize?: number; // Max compressed message size
  maxBackpressure?: number;   // Max backpressure
  cors?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
  };
}
```

#### Methods

##### listen(port?, host?)

Starts the server.

```typescript
listen(port?: number, host?: string): Promise<void>
```

**Parameters:**
- `port` (optional): Port to listen on
- `host` (optional): Host to bind to

**Returns:** Promise that resolves when server starts

##### use(middleware)

Adds middleware for connection handling.

```typescript
use(middleware: Middleware): NanoSocket
```

**Parameters:**
- `middleware`: Middleware function

**Returns:** Server instance for chaining

##### broadcast(event, ...args)

Broadcasts message to all connected clients.

```typescript
broadcast(event: string, ...args: any[]): void
```

##### to(room)

Targets a specific room for broadcasting.

```typescript
to(room: string | string[]): BroadcastOperator
```

##### close()

Stops the server and closes all connections.

```typescript
close(): Promise<void>
```

#### Properties

##### connectionCount

Number of currently connected clients.

```typescript
readonly connectionCount: number
```

##### roomNames

Array of all active room names.

```typescript
readonly roomNames: string[]
```

#### Events

- `connection` - New client connection
- `disconnect` - Client disconnection
- `listening` - Server started listening
- `error` - Server error
- `close` - Server closed

## Client API

### NanoSocketClient Class

WebSocket client with auto-reconnection and socket.io-like API.

#### Constructor

```typescript
new NanoSocketClient(url: string, options?: ClientOptions)
```

**Parameters:**
- `url`: WebSocket server URL
- `options` (optional): Client configuration options

**ClientOptions Interface:**
```typescript
interface ClientOptions {
  autoConnect?: boolean;        // Auto-connect on creation (default: true)
  reconnection?: boolean;       // Enable auto-reconnection (default: true)
  reconnectionAttempts?: number; // Max reconnection attempts (default: 5)
  reconnectionDelay?: number;   // Delay between attempts in ms (default: 1000)
  timeout?: number;             // Connection timeout in ms (default: 20000)
}
```

#### Methods

##### connect()

Connects to the WebSocket server.

```typescript
connect(): Promise<void>
```

##### disconnect()

Disconnects from the server.

```typescript
disconnect(): void
```

##### emit(event, ...args)

Sends message to the server.

```typescript
emit(event: string, ...args: any[]): boolean
```

##### on(event, handler)

Registers event handler.

```typescript
on(event: string, handler: EventHandler): this
```

##### off(event, handler?)

Removes event handler.

```typescript
off(event: string, handler?: EventHandler): this
```

##### once(event, handler)

Registers one-time event handler.

```typescript
once(event: string, handler: EventHandler): this
```

#### Properties

##### connected

Whether client is connected.

```typescript
readonly connected: boolean
```

##### connectionState

Current connection state.

```typescript
readonly connectionState: ConnectionState
```

##### readyState

WebSocket ready state.

```typescript
readonly readyState: number
```

#### Events

- `connect` - Connected to server
- `disconnect` - Disconnected from server
- `connecting` - Attempting to connect
- `reconnecting` - Attempting to reconnect
- `reconnect_failed` - Failed to reconnect
- `error` - Connection error

## Types

### ConnectionState

```typescript
enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting'
}
```

### EventHandler

```typescript
type EventHandler = (...args: any[]) => void;
```

### Middleware

```typescript
type Middleware = (socket: NanoSocketConnection, next: (err?: Error) => void) => void;
```

## Examples

See the [examples](../examples/) directory for complete usage examples:

- [Server Example](../examples/server.ts)
- [Client Example](../examples/client.ts)
- [Advanced Client](../examples/client2.ts)