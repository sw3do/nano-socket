import { NanoSocketClient } from '../src/client/NanoSocketClient';

const client2 = new NanoSocketClient('ws://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 5000
});

client2.on('connect', () => {
  console.log('Client 2 connected to server!');
  console.log('Client 2 connection state:', client2.connectionState);
  
  client2.emit('message', 'Hello from Client 2!');
  client2.emit('join-room', 'general');
});

client2.on('disconnect', (reason) => {
  console.log('Client 2 disconnected from server:', reason);
});

client2.on('connecting', () => {
  console.log('Client 2 connecting to server...');
});

client2.on('reconnecting', (attempt) => {
  console.log(`Client 2 reconnecting... Attempt ${attempt}`);
});

client2.on('reconnect_failed', () => {
  console.log('Client 2 failed to reconnect after maximum attempts');
});

client2.on('error', (error) => {
  console.error('Client 2 error:', error);
});

client2.on('welcome', (message) => {
  console.log('Client 2 welcome message:', message);
});

client2.on('echo', (data) => {
  console.log('Client 2 echo received:', data);
});

client2.on('user-joined', (userId) => {
  console.log(`Client 2 sees: User ${userId} joined the room`);
});

client2.on('user-left', (userId) => {
  console.log(`Client 2 sees: User ${userId} left the room`);
});

client2.on('global-message', (data) => {
  console.log('Client 2 global message:', data);
});

setInterval(() => {
  if (client2.connected) {
    client2.emit('message', `Ping from Client 2 at ${new Date().toISOString()}`);
  }
}, 7000);

setTimeout(() => {
  if (client2.connected) {
    client2.emit('broadcast', 'Hello everyone from Client 2!');
  }
}, 5000);

process.on('SIGINT', () => {
  console.log('\nDisconnecting Client 2...');
  client2.disconnect();
  process.exit(0);
});