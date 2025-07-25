import { Message } from '../types';

/**
 * Generates a unique identifier
 * @returns {string} Unique ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Serializes a message to JSON string
 * @param {Message} message - Message object to serialize
 * @returns {string} Serialized message
 */
export function serializeMessage(message: Message): string {
  try {
    return JSON.stringify(message);
  } catch (error) {
    throw new Error(`Failed to serialize message: ${error}`);
  }
}

/**
 * Deserializes a JSON string to message object
 * @param {string} data - JSON string to deserialize
 * @returns {Message} Deserialized message object
 */
export function deserializeMessage(data: string): Message {
  try {
    if (data.length > 1024 * 1024) {
      throw new Error('Message too large');
    }
    
    const parsed = JSON.parse(data);
    
    if (!parsed.event || typeof parsed.event !== 'string') {
      throw new Error('Invalid message format: missing or invalid event');
    }
    
    if (!isValidEventName(parsed.event)) {
      throw new Error(`Invalid event name: ${parsed.event}`);
    }
    
    if (!Array.isArray(parsed.data)) {
      parsed.data = parsed.data ? [parsed.data] : [];
    }
    
    return parsed as Message;
  } catch (error) {
    throw new Error(`Failed to deserialize message: ${error}`);
  }
}

/**
 * Validates if a string is a valid event name
 * @param {string} event - Event name to validate
 * @returns {boolean} True if valid event name
 */
export function isValidEventName(event: string): boolean {
  if (typeof event !== 'string' || event.length === 0) {
    return false;
  }
  
  if (event.startsWith('$') || event.includes('\0')) {
    return false;
  }
  
  const reservedEvents = ['connect', 'disconnect', 'error', 'connecting', 'reconnecting', 'reconnect_failed'];
  return !reservedEvents.includes(event);
}