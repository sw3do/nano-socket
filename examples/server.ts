import { NanoSocket } from '../src/server/NanoSocket';

/**
 * Example server implementation using NanoSocket
 */
const server = new NanoSocket({
  port: 3000,
  host: '0.0.0.0',
  compression: true,
  cors: {
    origin: '*',
    credentials: false
  }
});

server.use((socket, next) => {
  console.log(`New connection attempt from ${socket.remoteAddress}`);
  next();
});

server.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.emit('welcome', 'Hello from NanoSocket server!');
  
  socket.on('message', (data: any) => {
    console.log(`Received message from ${socket.id}:`, data);
    socket.emit('echo', data);
  });
  
  socket.on('join-room', (roomName: string) => {
    socket.join(roomName);
    console.log(`${socket.id} joined room: ${roomName}`);
    server.to(roomName).emit('user-joined', socket.id);
  });
  
  socket.on('leave-room', (roomName: string) => {
    socket.leave(roomName);
    console.log(`${socket.id} left room: ${roomName}`);
    server.to(roomName).emit('user-left', socket.id);
  });
  
  socket.on('broadcast', (message: any) => {
    server.broadcast('global-message', {
      from: socket.id,
      message: message,
      timestamp: Date.now()
    });
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.on('listening', (port, host) => {
  console.log(`NanoSocket server listening on ${host}:${port}`);
  console.log(`Connected clients: ${server.connectionCount}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen().then(() => {
  console.log('Server started successfully!');
}).catch((error) => {
  console.error('Failed to start server:', error);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await server.close();
  process.exit(0);
});