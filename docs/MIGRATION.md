# Migration Guide

This guide helps you migrate from other WebSocket libraries to NanoSocket.

## Table of Contents

- [From Socket.io](#from-socketio)
- [From ws](#from-ws)
- [From WebSocket (native)](#from-websocket-native)
- [From Engine.io](#from-engineio)
- [Common Migration Patterns](#common-migration-patterns)
- [Breaking Changes](#breaking-changes)

## From Socket.io

NanoSocket provides a socket.io-like API, making migration straightforward.

### Server Migration

#### Socket.io (Before)

```javascript
const { Server } = require('socket.io');
const io = new Server(3000, {
  cors: {
    origin: "*"
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('message', (data) => {
    socket.emit('echo', data);
  });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    io.to(room).emit('user-joined', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

#### NanoSocket (After)

```typescript
import { NanoSocket } from '@sw3doo/nano-socke';

const server = new NanoSocket({
  port: 3000,
  cors: {
    origin: "*"
  }
});

server.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('message', (data) => {
    socket.emit('echo', data);
  });
  
  socket.on('join-room', (room) => {
    socket.join(room);
    server.to(room).emit('user-joined', socket.id);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen();
```

### Client Migration

#### Socket.io Client (Before)

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected!');
});

socket.on('message', (data) => {
  console.log('Received:', data);
});

socket.emit('join-room', 'general');
```

#### NanoSocket Client (After)

```typescript
import { NanoSocketClient } from '@sw3doo/nano-socke';

const client = new NanoSocketClient('ws://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
});

client.on('connect', () => {
  console.log('Connected!');
});

client.on('message', (data) => {
  console.log('Received:', data);
});

client.emit('join-room', 'general');
```

### Key Differences from Socket.io

| Feature | Socket.io | NanoSocket | Notes |
|---------|-----------|------------|-------|
| Transport | HTTP polling + WebSocket | WebSocket only | Simpler, faster |
| Namespaces | ✅ | ❌ | Use rooms instead |
| Acknowledgments | ✅ | ❌ | Planned for future |
| Binary data | ✅ | ✅ | Full support |
| Middleware | ✅ | ✅ | Similar API |
| Rooms | ✅ | ✅ | Full compatibility |

## From ws

Migrating from the `ws` library requires more changes due to different APIs.

### Server Migration

#### ws (Before)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message.type === 'echo') {
      ws.send(JSON.stringify({
        type: 'echo',
        data: message.data
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

#### NanoSocket (After)

```typescript
import { NanoSocket } from '@sw3doo/nano-socke';

const server = new NanoSocket({ port: 3000 });

server.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('echo', (data) => {
    socket.emit('echo', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen();
```

### Client Migration

#### ws Client (Before)

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    type: 'echo',
    data: 'Hello'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});

ws.on('close', () => {
  console.log('Disconnected');
});
```

#### NanoSocket Client (After)

```typescript
import { NanoSocketClient } from '@sw3doo/nano-socke';

const client = new NanoSocketClient('ws://localhost:3000');

client.on('connect', () => {
  console.log('Connected');
  client.emit('echo', 'Hello');
});

client.on('echo', (data) => {
  console.log('Received:', data);
});

client.on('disconnect', () => {
  console.log('Disconnected');
});
```

### Migration Benefits from ws

- **Event-based API**: No more manual JSON parsing
- **Auto-reconnection**: Built-in reconnection logic
- **Room support**: Easy broadcasting to groups
- **TypeScript**: Full type safety
- **Better performance**: uWebSockets.js backend

## From WebSocket (native)

Migrating from native WebSocket API.

### Before (Native WebSocket)

```javascript
const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ type: 'message', data: 'Hello' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = () => {
  console.log('Disconnected');
};

ws.onerror = (error) => {
  console.error('Error:', error);
};
```

### After (NanoSocket)

```typescript
import { NanoSocketClient } from '@sw3doo/nano-socke';

const client = new NanoSocketClient('ws://localhost:3000');

client.on('connect', () => {
  console.log('Connected');
  client.emit('message', 'Hello');
});

client.on('message', (data) => {
  console.log('Received:', data);
});

client.on('disconnect', () => {
  console.log('Disconnected');
});

client.on('error', (error) => {
  console.error('Error:', error);
});
```

## From Engine.io

Engine.io users can migrate to NanoSocket for better performance.

### Before (Engine.io)

```javascript
const engine = require('engine.io');
const server = engine.listen(3000);

server.on('connection', (socket) => {
  socket.on('message', (data) => {
    socket.send('echo: ' + data);
  });
});
```

### After (NanoSocket)

```typescript
import { NanoSocket } from '@sw3doo/nano-socket';

const server = new NanoSocket({ port: 3000 });

server.on('connection', (socket) => {
  socket.on('message', (data) => {
    socket.emit('echo', data);
  });
});

server.listen();
```

## Common Migration Patterns

### 1. Authentication Middleware

#### Before (Socket.io)

```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

#### After (NanoSocket)

```typescript
server.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValidToken(token)) {
    next();
  } else {
    next(new Error('Authentication error'));
  }
});
```

### 2. Room Broadcasting

#### Before (Socket.io)

```javascript
socket.join('room1');
io.to('room1').emit('message', 'Hello room!');
```

#### After (NanoSocket)

```typescript
socket.join('room1');
server.to('room1').emit('message', 'Hello room!');
```

### 3. Error Handling

#### Before (Various libraries)

```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

#### After (NanoSocket)

```typescript
client.on('error', (error) => {
  console.error('NanoSocket error:', error);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});
```

## Breaking Changes

When migrating to NanoSocket, be aware of these breaking changes:

### 1. No HTTP Polling

NanoSocket only supports WebSocket transport, not HTTP long-polling.

**Impact**: Clients must support WebSocket
**Solution**: Modern browsers and Node.js support WebSocket natively

### 2. No Namespaces

NanoSocket doesn't support Socket.io namespaces.

**Impact**: Code using namespaces needs refactoring
**Solution**: Use rooms or separate server instances

```javascript
// Before (Socket.io namespaces)
const adminNamespace = io.of('/admin');
const userNamespace = io.of('/user');

// After (NanoSocket rooms)
server.on('connection', (socket) => {
  socket.on('join-admin', () => {
    socket.join('admin-room');
  });
  
  socket.on('join-user', () => {
    socket.join('user-room');
  });
});
```

### 3. No Acknowledgments (Yet)

NanoSocket doesn't support message acknowledgments in v1.0.

**Impact**: Request-response patterns need alternative implementation
**Solution**: Use unique message IDs and response events

```typescript
// Workaround for acknowledgments
const pendingRequests = new Map();

function sendWithAck(event: string, data: any): Promise<any> {
  return new Promise((resolve) => {
    const id = generateId();
    pendingRequests.set(id, resolve);
    client.emit(event, { id, data });
  });
}

client.on('response', ({ id, data }) => {
  const resolve = pendingRequests.get(id);
  if (resolve) {
    resolve(data);
    pendingRequests.delete(id);
  }
});
```

## Migration Checklist

- [ ] Update package dependencies
- [ ] Replace library imports
- [ ] Update server initialization
- [ ] Update client initialization
- [ ] Migrate authentication middleware
- [ ] Update room management code
- [ ] Replace namespaces with rooms (if applicable)
- [ ] Update error handling
- [ ] Test reconnection behavior
- [ ] Update TypeScript types
- [ ] Performance test with real workload
- [ ] Update documentation

## Getting Help

If you encounter issues during migration:

1. Check the [API documentation](API.md)
2. Review [examples](../examples/)
3. Search [GitHub issues](https://github.com/sw3do/nano-socket/issues)
4. Create a new issue with migration details

## Performance Benefits After Migration

After migrating to NanoSocket, you should see:

- **10x faster** message throughput
- **50% lower** memory usage
- **Reduced** CPU usage
- **Better** connection handling
- **Improved** scalability

See the [Performance Guide](PERFORMANCE.md) for optimization tips.