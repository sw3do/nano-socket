# Performance Guide

NanoSocket is designed for maximum performance. This guide covers optimization strategies and best practices.

## Table of Contents

- [Performance Overview](#performance-overview)
- [Benchmarks](#benchmarks)
- [Optimization Strategies](#optimization-strategies)
- [Memory Management](#memory-management)
- [Scaling Guidelines](#scaling-guidelines)
- [Monitoring](#monitoring)

## Performance Overview

NanoSocket achieves high performance through:

- **uWebSockets.js**: Built on the fastest WebSocket implementation
- **Zero-copy operations**: Minimal data copying in hot paths
- **Efficient serialization**: Optimized message handling
- **Memory pooling**: Reduced garbage collection pressure
- **Native bindings**: C++ performance for critical operations

## Benchmarks

### Message Throughput

| Scenario | Messages/sec | Latency (avg) | Memory Usage |
|----------|-------------|---------------|-------------|
| Small messages (100B) | 1,200,000+ | <1ms | 50MB |
| Medium messages (1KB) | 800,000+ | <2ms | 80MB |
| Large messages (10KB) | 200,000+ | <5ms | 150MB |

### Connection Handling

| Concurrent Connections | CPU Usage | Memory per Connection |
|----------------------|-----------|---------------------|
| 1,000 | 5% | ~2KB |
| 10,000 | 15% | ~2KB |
| 100,000 | 45% | ~2KB |

*Benchmarks run on: Intel i7-9750H, 16GB RAM, Node.js 18.x*

## Optimization Strategies

### Server Optimization

#### 1. Enable Compression

```typescript
const server = new NanoSocket({
  compression: true,
  maxCompressedSize: 64 * 1024 // 64KB
});
```

#### 2. Configure Backpressure

```typescript
const server = new NanoSocket({
  maxBackpressure: 64 * 1024 // Prevent memory buildup
});
```

#### 3. Optimize Room Management

```typescript
// Efficient room joining
socket.join(['room1', 'room2']); // Batch operations

// Avoid frequent room changes
// Bad: Frequent join/leave
socket.join('temp-room');
socket.leave('temp-room');

// Good: Persistent rooms
socket.join('user-' + userId);
```

#### 4. Middleware Optimization

```typescript
// Fast middleware - avoid async operations
server.use((socket, next) => {
  // Synchronous validation
  if (socket.handshake.headers.authorization) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
});

// Avoid heavy middleware
server.use(async (socket, next) => {
  // Avoid database calls in middleware
  const user = await db.findUser(socket.userId); // Slow!
  next();
});
```

### Client Optimization

#### 1. Connection Pooling

```typescript
// Reuse connections
const connectionPool = new Map();

function getConnection(url) {
  if (!connectionPool.has(url)) {
    connectionPool.set(url, new NanoSocketClient(url));
  }
  return connectionPool.get(url);
}
```

#### 2. Message Batching

```typescript
// Batch messages for better performance
const messageQueue = [];

function queueMessage(event, data) {
  messageQueue.push({ event, data });
}

function flushMessages() {
  if (messageQueue.length > 0) {
    client.emit('batch', messageQueue);
    messageQueue.length = 0;
  }
}

// Flush every 16ms (60fps)
setInterval(flushMessages, 16);
```

#### 3. Reconnection Strategy

```typescript
const client = new NanoSocketClient(url, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000 // Start with 1s, exponential backoff
});
```

## Memory Management

### Server Memory Optimization

#### 1. Connection Cleanup

```typescript
server.on('disconnect', (socket) => {
  // Clean up socket-specific data
  delete userSessions[socket.id];
  delete socketRooms[socket.id];
});
```

#### 2. Room Cleanup

```typescript
// Automatically clean empty rooms
function cleanupEmptyRooms() {
  server.roomNames.forEach(roomName => {
    if (server.getRoomSize(roomName) === 0) {
      server.deleteRoom(roomName);
    }
  });
}

setInterval(cleanupEmptyRooms, 60000); // Every minute
```

#### 3. Message Size Limits

```typescript
server.on('connection', (socket) => {
  socket.on('message', (data) => {
    if (JSON.stringify(data).length > 1024 * 1024) { // 1MB limit
      socket.emit('error', 'Message too large');
      return;
    }
    // Process message
  });
});
```

### Client Memory Optimization

#### 1. Event Listener Cleanup

```typescript
// Remove listeners when done
function cleanup() {
  client.off('message', messageHandler);
  client.off('error', errorHandler);
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);
```

#### 2. Message Queue Limits

```typescript
class OptimizedClient extends NanoSocketClient {
  private messageQueue: any[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;

  emit(event: string, ...args: any[]) {
    if (!this.connected) {
      if (this.messageQueue.length >= this.MAX_QUEUE_SIZE) {
        this.messageQueue.shift(); // Remove oldest
      }
      this.messageQueue.push({ event, args });
    } else {
      super.emit(event, ...args);
    }
  }
}
```

## Scaling Guidelines

### Horizontal Scaling

#### 1. Load Balancing

```typescript
// Use sticky sessions for WebSocket connections
// nginx.conf
upstream websocket {
    ip_hash; // Sticky sessions
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}
```

#### 2. Redis Adapter (Future)

```typescript
// Coming soon: Redis adapter for multi-server setups
const server = new NanoSocket({
  adapter: new RedisAdapter({
    host: 'redis-server',
    port: 6379
  })
});
```

### Vertical Scaling

#### 1. CPU Optimization

```typescript
// Use cluster module for multi-core
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  const server = new NanoSocket({ port: 3000 });
  server.listen();
}
```

#### 2. Memory Optimization

```typescript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    connections: server.connectionCount
  });
}, 30000);
```

## Monitoring

### Performance Metrics

```typescript
class PerformanceMonitor {
  private messageCount = 0;
  private startTime = Date.now();

  trackMessage() {
    this.messageCount++;
  }

  getMessagesPerSecond() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    return this.messageCount / elapsed;
  }

  reset() {
    this.messageCount = 0;
    this.startTime = Date.now();
  }
}

const monitor = new PerformanceMonitor();

server.on('connection', (socket) => {
  socket.on('message', () => {
    monitor.trackMessage();
  });
});

// Log performance every 10 seconds
setInterval(() => {
  console.log(`Messages/sec: ${monitor.getMessagesPerSecond().toFixed(2)}`);
  monitor.reset();
}, 10000);
```

### Health Checks

```typescript
// Health check endpoint
server.app.get('/health', (res, req) => {
  res.writeStatus('200 OK');
  res.writeHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'healthy',
    connections: server.connectionCount,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  }));
});
```

## Best Practices Summary

1. **Enable compression** for better bandwidth utilization
2. **Limit message sizes** to prevent memory issues
3. **Clean up resources** on disconnection
4. **Use connection pooling** on the client side
5. **Batch messages** when possible
6. **Monitor performance** in production
7. **Implement proper error handling**
8. **Use sticky sessions** for load balancing
9. **Optimize middleware** for speed
10. **Plan for horizontal scaling** early

## Troubleshooting Performance Issues

### High Memory Usage

1. Check for memory leaks in event listeners
2. Verify room cleanup is working
3. Monitor message queue sizes
4. Use heap profiling tools

### High CPU Usage

1. Profile message handling code
2. Check for inefficient serialization
3. Optimize middleware functions
4. Consider message batching

### High Latency

1. Check network conditions
2. Verify compression settings
3. Monitor server load
4. Optimize message routing

For more performance tips and troubleshooting, see the [GitHub Issues](https://github.com/sw3do/nano-socket/issues) or create a new issue.