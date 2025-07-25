import { NanoSocketClient } from '../src/client/NanoSocketClient';

/**
 * Example client implementation using NanoSocketClient
 */
const client = new NanoSocketClient('ws://localhost:3000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 5000
});

client.on('connect', () => {
  console.log('Connected to server!');
  console.log('Connection state:', client.connectionState);
  
  client.emit('message', 'Hello from NanoSocket client!');
  
  client.emit('join-room', 'general');
});

client.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
});

client.on('connecting', () => {
  console.log('Connecting to server...');
});

client.on('reconnecting', (attempt) => {
  console.log(`Reconnecting... Attempt ${attempt}`);
});

client.on('reconnect_failed', () => {
  console.log('Failed to reconnect after maximum attempts');
});

client.on('error', (error) => {
  console.error('Client error:', error);
});

client.on('welcome', (message) => {
  console.log('Welcome message:', message);
});

client.on('echo', (data) => {
  console.log('Echo received:', data);
});

client.on('user-joined', (userId) => {
  console.log(`User ${userId} joined the room`);
});

client.on('user-left', (userId) => {
  console.log(`User ${userId} left the room`);
});

client.on('global-message', (data) => {
  console.log('Global message:', data);
});

setInterval(() => {
  if (client.connected) {
    client.emit('message', `Ping from client at ${new Date().toISOString()}`);
  }
}, 5000);

setTimeout(() => {
  if (client.connected) {
    client.emit('broadcast', 'Hello everyone!');
  }
}, 3000);

process.on('SIGINT', () => {
  console.log('\nDisconnecting client...');
  client.disconnect();
  process.exit(0);
});